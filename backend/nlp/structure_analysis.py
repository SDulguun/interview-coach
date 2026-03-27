"""Structure analysis: action verbs and STAR method detection."""
import re

# Mongolian action verbs commonly used in strong interview answers
MONGOLIAN_ACTION_VERBS = [
    'хийсэн', 'удирдсан', 'зохион байгуулсан', 'боловсруулсан',
    'хэрэгжүүлсэн', 'шийдвэрлэсэн', 'сайжруулсан', 'бүтээсэн',
    'хариуцсан', 'тайлагнасан', 'зохицуулсан', 'хамтарсан',
    'санаачилсан', 'нэвтрүүлсэн', 'хөгжүүлсэн', 'гүйцэтгэсэн',
    'оролцсон', 'дадлагажсан', 'суралцсан', 'ажилласан',
    'амжилттай', 'биелүүлсэн', 'хангасан', 'баталгаажуулсан',
    'төлөвлөж', 'эрэмбэлж', 'тодорхойлж', 'гүйцэтгэж',
    'хичээдэг', 'ажилладаг', 'харилцаж', 'хуваалцдаг',
    'дууcгаж', 'амжуулж', 'чадсан', 'болсон',
]

ENGLISH_ACTION_VERBS = [
    'led', 'managed', 'developed', 'implemented', 'achieved',
    'created', 'improved', 'designed', 'organized', 'delivered',
    'built', 'launched', 'resolved', 'analyzed', 'coordinated',
]

# STAR method indicators
STAR_INDICATORS = {
    "situation": {
        "mn": ['байгууллагад', 'компанид', 'үед', 'нөхцөл', 'тухайн үед', 'ажиллаж байхад',
               'өмнө нь', 'ажил дээрээ', 'хувьд', 'тохиолдолд', 'байсан үед', 'нөхцөлд'],
        "en": ['when i was', 'at my previous', 'in my role', 'the situation was'],
    },
    "task": {
        "mn": ['даалгавар', 'хариуцлага', 'үүрэг', 'зорилго', 'шаардлага',
               'хэрэгтэй', 'чухал', 'яаралтай', 'гаргах', 'хийх'],
        "en": ['i was responsible', 'my task was', 'i needed to', 'the goal was'],
    },
    "action": {
        "mn": ['хийсэн', 'гүйцэтгэсэн', 'шийдвэрлэсэн', 'хэрэгжүүлсэн', 'зохион байгуулсан',
               'төлөвлөж', 'эрэмбэлж', 'ажиллаж', 'хичээж', 'оролдож', 'эхлээд', 'тодорхойлоод'],
        "en": ['i did', 'i implemented', 'i created', 'i organized', 'i decided'],
    },
    "result": {
        "mn": ['үр дүн', 'амжилт', 'дүн', 'хувь', 'өссөн', 'буурсан', 'сайжирсан', '%',
               'амжилттай', 'дуусгаж', 'болсон', 'чадсан', 'бүтээмжийг', 'нэмэгдүүлсэн'],
        "en": ['as a result', 'the outcome', 'we achieved', 'this led to', 'increased by'],
    },
}


def detect_action_verbs(text: str) -> dict:
    """Find action verbs in the response."""
    if not isinstance(text, str) or not text.strip():
        return {"count": 0, "verbs": []}

    text_lower = text.lower()
    found = []

    for verb in MONGOLIAN_ACTION_VERBS:
        if verb in text_lower:
            found.append({"verb": verb, "language": "mn"})

    for verb in ENGLISH_ACTION_VERBS:
        if re.search(r'\b' + re.escape(verb) + r'\b', text_lower):
            found.append({"verb": verb, "language": "en"})

    return {"count": len(found), "verbs": found}


def detect_star_method(text: str) -> dict:
    """Detect STAR method elements in the response."""
    if not isinstance(text, str) or not text.strip():
        return {"elements_found": 0, "elements": {}, "score": 0.0}

    text_lower = text.lower()
    elements = {}

    for element, indicators in STAR_INDICATORS.items():
        found_indicators = []
        for lang, phrases in indicators.items():
            for phrase in phrases:
                if phrase in text_lower:
                    found_indicators.append({"phrase": phrase, "language": lang})
        elements[element] = {
            "detected": len(found_indicators) > 0,
            "indicators": found_indicators,
        }

    elements_found = sum(1 for e in elements.values() if e["detected"])
    score = elements_found / 4.0

    return {
        "elements_found": elements_found,
        "elements": elements,
        "score": round(score, 2),
    }


def analyze_structure(text: str) -> dict:
    """Full structure analysis."""
    action_verbs = detect_action_verbs(text)
    star = detect_star_method(text)

    return {
        "action_verbs": action_verbs,
        "star_method": star,
    }
