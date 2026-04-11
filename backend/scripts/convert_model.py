"""Convert a multilingual sentence-transformer to Core ML format.

Downloads 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
wraps it with mean-pooling + L2 normalization, and converts to Core ML
.mlpackage via torch.export for native macOS inference.

Usage:
    pip install torch transformers coremltools
    python -m backend.scripts.convert_model
"""

import os
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoModel, AutoTokenizer, AutoConfig
import coremltools as ct

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
SEQ_LENGTH = 128
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "multilingual-minilm.mlpackage")


class SentenceEmbeddingModel(nn.Module):
    """Standalone embedding model: transformer + mean pooling + L2 norm.

    Computes the attention mask internally from input_ids (non-pad = real token)
    so we only need to trace a single-input forward pass, avoiding the
    masking_utils ops that coremltools can't convert.
    """

    def __init__(self, config):
        super().__init__()
        from transformers.models.bert.modeling_bert import (
            BertEmbeddings,
            BertEncoder,
        )
        self.embeddings = BertEmbeddings(config)
        self.encoder = BertEncoder(config)
        # Store pad_token_id so mask derivation uses the correct value.
        # IMPORTANT: config.pad_token_id=0 is WRONG for this model!
        # The tokenizer uses pad_token_id=1 (token 0 = CLS, 1 = PAD, 2 = SEP).
        self.register_buffer(
            "pad_token_id",
            torch.tensor(1, dtype=torch.long),
        )

    def forward(self, input_ids):
        # Derive attention mask: 1 where token is NOT the pad token
        attention_mask = (input_ids != self.pad_token_id).long()

        # Get embeddings
        embedding_output = self.embeddings(input_ids=input_ids)

        # Create extended attention mask manually (avoid masking_utils)
        extended_mask = attention_mask.unsqueeze(1).unsqueeze(2).float()
        extended_mask = (1.0 - extended_mask) * -10000.0

        # Run encoder
        encoder_output = self.encoder(
            embedding_output,
            attention_mask=extended_mask,
        )
        token_embeddings = encoder_output.last_hidden_state

        # Mean pooling
        mask_expanded = attention_mask.unsqueeze(-1).float()
        sum_embeddings = torch.sum(token_embeddings * mask_expanded, dim=1)
        sum_mask = torch.clamp(mask_expanded.sum(dim=1), min=1e-9)
        embeddings = sum_embeddings / sum_mask

        # L2 normalize
        embeddings = F.normalize(embeddings, p=2, dim=1)
        return embeddings


def main():
    print(f"Loading model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    # Load config and create our custom model
    config = AutoConfig.from_pretrained(MODEL_NAME)
    config._attn_implementation = "eager"
    model = SentenceEmbeddingModel(config)

    # Load weights from the pretrained model
    pretrained = AutoModel.from_pretrained(MODEL_NAME, attn_implementation="eager")
    # Copy embeddings weights
    model.embeddings.load_state_dict(pretrained.embeddings.state_dict())
    # Copy encoder weights
    model.encoder.load_state_dict(pretrained.encoder.state_dict())
    model.eval()

    # Verify PyTorch output matches the original model
    test_text = "Би программ хангамжийн инженерээр ажилласан."
    encoded = tokenizer(
        test_text,
        max_length=SEQ_LENGTH,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )

    with torch.no_grad():
        our_emb = model(encoded["input_ids"]).numpy()[0]
        # Compare with original
        pretrained.eval()
        orig_out = pretrained(
            encoded["input_ids"], encoded["attention_mask"]
        ).last_hidden_state
        mask_exp = encoded["attention_mask"].unsqueeze(-1).float()
        orig_pooled = (orig_out * mask_exp).sum(1) / mask_exp.sum(1).clamp(min=1e-9)
        orig_emb = F.normalize(orig_pooled, p=2, dim=1).numpy()[0]

    weight_sim = np.dot(our_emb, orig_emb) / (
        np.linalg.norm(our_emb) * np.linalg.norm(orig_emb)
    )
    print(f"Weight transfer verification (should be >0.99): {weight_sim:.6f}")

    # Trace our single-input model (fill with pad_token_id, not zeros)
    dummy_input = torch.full((1, SEQ_LENGTH), config.pad_token_id, dtype=torch.int64)
    print("Tracing model with TorchScript...")
    with torch.no_grad():
        traced = torch.jit.trace(model, dummy_input)

    print("Converting to Core ML (.mlpackage)...")
    mlmodel = ct.convert(
        traced,
        inputs=[
            ct.TensorType("input_ids", shape=(1, SEQ_LENGTH), dtype=np.int32),
        ],
        minimum_deployment_target=ct.target.macOS13,
        convert_to="mlprogram",
    )

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Saving to: {OUTPUT_PATH}")
    mlmodel.save(OUTPUT_PATH)

    # Verify Core ML output
    print("\nVerifying Core ML conversion...")
    coreml_pred = mlmodel.predict({
        "input_ids": encoded["input_ids"].numpy().astype(np.int32),
    })

    output_key = list(coreml_pred.keys())[0]
    coreml_emb = np.array(coreml_pred[output_key]).flatten()[:384]

    cosine_sim = np.dot(our_emb, coreml_emb) / (
        np.linalg.norm(our_emb) * np.linalg.norm(coreml_emb)
    )
    print(f"PyTorch embedding shape: {our_emb.shape}")
    print(f"Core ML embedding shape:  {coreml_emb.shape}")
    print(f"Cosine similarity (should be >0.99): {cosine_sim:.6f}")

    if cosine_sim > 0.99:
        print("\nConversion successful!")
    else:
        print("\nWARNING: Low similarity — check conversion.")

    print(f"\nModel saved to: {os.path.abspath(OUTPUT_PATH)}")
    print("You can now start the FastAPI server with Core ML scoring enabled.")

    del pretrained  # Free memory


if __name__ == "__main__":
    main()
