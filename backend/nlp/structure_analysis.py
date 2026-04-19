"""Structure analysis: action verbs and STAR method detection."""
import re

# Mongolian action verbs commonly used in strong interview answers
# Includes past tense (-сан/-сэн/-сон), continuous (-ж/-ч), habitual (-даг/-дэг)
MONGOLIAN_ACTION_VERBS = [
    # Past completive (-сан/-сэн)
    'хийсэн', 'удирдсан', 'зохион байгуулсан', 'боловсруулсан',
    'хэрэгжүүлсэн', 'шийдвэрлэсэн', 'сайжруулсан', 'бүтээсэн',
    'хариуцсан', 'тайлагнасан', 'зохицуулсан', 'хамтарсан',
    'санаачилсан', 'нэвтрүүлсэн', 'хөгжүүлсэн', 'гүйцэтгэсэн',
    'оролцсон', 'дадлагажсан', 'суралцсан', 'ажилласан',
    'биелүүлсэн', 'хангасан', 'баталгаажуулсан',
    'бичсэн', 'тодорхойлсон', 'шинжилсэн', 'судалсан',
    'туршсан', 'нийлүүлсэн', 'хуваарилсан', 'оновчилсон',
    'сургасан', 'чиглүүлсэн', 'дэмжсэн', 'шалгасан',
    'тогтоосон', 'төлөвлөсөн', 'зохиосон', 'сонгосон',
    # Continuous/progressive (-ж/-ч)
    'төлөвлөж', 'эрэмбэлж', 'тодорхойлж', 'гүйцэтгэж',
    'ажиллаж', 'харилцаж', 'хуваалцдаг', 'хамтарч',
    'удирдаж', 'хариуцаж', 'зохицуулж', 'шийдвэрлэж',
    'боловсруулж', 'шинжилж', 'судалж', 'бичиж',
    'сургаж', 'чиглүүлж', 'дэмжиж', 'хөгжүүлж',
    # Habitual (-даг/-дэг/-дог)
    'хичээдэг', 'ажилладаг', 'хуваалцдаг', 'оролцдог',
    'удирддаг', 'хариуцдаг', 'хамтардаг', 'зохицуулдаг',
    'суралцдаг', 'хичээж', 'чармайж',
    # Result/completion forms
    'дууcгаж', 'амжуулж', 'чадсан', 'болсон', 'амжилттай',
    'нэмэгдүүлсэн', 'бууруулсан', 'хурдасгасан', 'багасгасан',
    # Short verb stems (common in conversational Mongolian)
    'хийж', 'авч', 'өгч', 'ирж', 'очиж', 'гарч',
]

ENGLISH_ACTION_VERBS = [
    'led', 'managed', 'developed', 'implemented', 'achieved',
    'created', 'improved', 'designed', 'organized', 'delivered',
    'built', 'launched', 'resolved', 'analyzed', 'coordinated',
    'collaborated', 'mentored', 'trained', 'solved', 'optimized',
    'reduced', 'increased', 'completed', 'established', 'presented',
]

# STAR method indicators — expanded for natural Mongolian conversation
STAR_INDICATORS = {
    "situation": {
        "mn": ['байгууллагад', 'компанид', 'үед', 'нөхцөл', 'тухайн үед', 'ажиллаж байхад',
               'өмнө нь', 'ажил дээрээ', 'хувьд', 'тохиолдолд', 'байсан үед', 'нөхцөлд',
               'нэг удаа', 'тэр үед', 'жилд', 'сарын', 'анхны', 'эхний',
               'байхад', 'болоход', 'тулгарахад', 'гарахад',
               'нэгэн удаа', 'тохиолдол', 'туршлага', 'жишээ'],
        "en": ['when i was', 'at my previous', 'in my role', 'the situation was',
               'at that time', 'while working', 'during my', 'one time'],
    },
    "task": {
        "mn": ['даалгавар', 'хариуцлага', 'үүрэг', 'зорилго', 'шаардлага',
               'хэрэгтэй', 'чухал', 'яаралтай', 'гаргах', 'хийх',
               'хариуцсан', 'үүрэг нь', 'зорилго нь', 'миний ажил',
               'надад', 'хариуцаж', 'гүйцэтгэх', 'шийдэх'],
        "en": ['i was responsible', 'my task was', 'i needed to', 'the goal was',
               'i had to', 'my job was', 'assigned to'],
    },
    "action": {
        "mn": ['хийсэн', 'гүйцэтгэсэн', 'шийдвэрлэсэн', 'хэрэгжүүлсэн', 'зохион байгуулсан',
               'төлөвлөж', 'эрэмбэлж', 'ажиллаж', 'хичээж', 'оролдож', 'эхлээд', 'тодорхойлоод',
               'хийж', 'авч', 'гарч', 'тавьж', 'нэвтрүүлж', 'санал болгож',
               'ярилцаж', 'зохицуулж', 'удирдаж', 'бичиж', 'хуваарилж',
               'шийдвэр гарга', 'арга хэмжээ', 'алхам'],
        "en": ['i did', 'i implemented', 'i created', 'i organized', 'i decided',
               'i took', 'i started', 'i proposed', 'i built', 'i wrote'],
    },
    "result": {
        "mn": ['үр дүн', 'амжилт', 'дүн', 'хувь', 'өссөн', 'буурсан', 'сайжирсан', '%',
               'амжилттай', 'дуусгаж', 'болсон', 'чадсан', 'бүтээмжийг', 'нэмэгдүүлсэн',
               'дууссан', 'бүрэн', 'хугацаанд', 'гарсан', 'тус болсон',
               'хэрэглэгч', 'ашигласан', 'зорилгодоо', 'хүрсэн', 'биелсэн',
               'сэтгэл ханамж', 'эерэг', 'нөлөөлсөн', 'хадгалсан'],
        "en": ['as a result', 'the outcome', 'we achieved', 'this led to', 'increased by',
               'resulting in', 'successfully', 'completed', 'improved by'],
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
