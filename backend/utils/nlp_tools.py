import re

def count_syllables(word: str) -> int:
    word = word.lower().strip(".:,;!?\"'()[]{}")
    if not word:
        return 0
    vowels = "aeiouy"
    count = 0
    if word[0] in vowels:
        count += 1
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
    if word.endswith("e"):
        count -= 1
    if count == 0:
        count = 1
    return count

def calculate_readability_score(text: str) -> float:
    """
    Computes Flesch Reading Ease score:
    206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    """
    words = text.split()
    if not words:
        return 100.0
    
    # Split text into sentences using simple punctuation check
    sentences = re.split(r'[.!?]+', text)
    sentence_count = max(1, len([s for s in sentences if s.strip()]))
    word_count = len(words)
    syllable_count = sum(count_syllables(w) for w in words)
    
    score = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (syllable_count / word_count)
    return round(max(0.0, min(100.0, score)), 1)

def simulate_audience_reactions(text: str) -> dict:
    """
    Simulates how Gen Z, Seniors, and B2B buyers would react to the ad copy.
    """
    word_count = len(text.split())
    has_emojis = any(char in text for char in ["🚀", "🔥", "✨", "💖", "👉", "💡", "🎯", "🌟"])
    
    # Gen Z
    genz_score = 55.0
    if has_emojis: genz_score += 15.0
    if word_count < 30: genz_score += 20.0
    else: genz_score -= 10.0
    if "pov" in text.lower() or "aesthetic" in text.lower(): genz_score += 10.0
    
    # B2B Buyers
    b2b_score = 50.0
    if any(keyword in text.lower() for keyword in ["result", "growth", "roi", "business", "scale", "performance", "revenue"]):
        b2b_score += 30.0
    if has_emojis: b2b_score -= 10.0
    if word_count > 40: b2b_score += 10.0
    
    # Seniors
    senior_score = 65.0
    if word_count > 45: senior_score += 10.0
    if has_emojis: senior_score -= 20.0
    if "?" in text: senior_score += 5.0

    return {
        "Gen Z": {
            "score": round(max(10.0, min(100.0, genz_score)), 1),
            "feedback": "Vibrant and short content connects well with Gen Z." if genz_score > 65 else "Too corporate/long. Add emojis or shorten."
        },
        "B2B Buyers": {
            "score": round(max(10.0, min(100.0, b2b_score)), 1),
            "feedback": "Communicates high value proposition and ROI metrics." if b2b_score > 65 else "Lacks business alignment. Focus on growth/ROI."
        },
        "Seniors": {
            "score": round(max(10.0, min(100.0, senior_score)), 1),
            "feedback": "Standard structured language is readable." if senior_score > 65 else "Too many emojis or slang. Simplify formatting."
        }
    }

def optimize_pricing_copy(text: str) -> str:
    """
    Applies price psychology principles, e.g., converting 1000 to 999.
    """
    def price_replacer(match):
        price_str = match.group(1)
        val = int(price_str)
        if val >= 10 and val % 10 == 0:
            return f"${val - 1}"
        return match.group(0)
    
    # Matches currency patterns like $500, 1000, etc.
    res = re.sub(r'\$?(\d+)', price_replacer, text)
    if "save" in res.lower() and "%" not in res:
        res += " (Get 33% off today!)"
    return res

def convert_to_ugc_style(text: str) -> str:
    """
    Converts ad copy to UGC (User Generated Content) conversational format.
    """
    cleaned = text.replace("Introducing ", "Okay but I literally tried ").replace("Discover the new ", "You guys, I got this new ")
    if not cleaned.startswith("POV:"):
        return f"POV: You finally found the perfect match... ✨\n\n\"{cleaned}\"\n\nHonestly 10/10, highly recommend! 🙌 #UGC #viral"
    return cleaned
