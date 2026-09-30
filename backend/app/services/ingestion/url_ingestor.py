from typing import Dict, Any
import httpx
from bs4 import BeautifulSoup

def extract_from_url(url: str) -> Dict[str, Any]:
    """Scrapes and parses article content and metadata from a web URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ParivartanAI/1.0"
        }
        with httpx.Client(timeout=15.0, follow_redirects=True, headers=headers) as client:
            response = client.get(url)
            response.raise_for_status()
            html = response.text

        soup = BeautifulSoup(html, "html.parser")
        
        # Remove noisy tags
        for element in soup(["script", "style", "nav", "footer", "header", "noscript", "aside", "svg"]):
            element.decompose()

        # Find title
        title = ""
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        elif soup.find("h1"):
            title = soup.find("h1").get_text().strip()

        # Target main content container if available
        article = soup.find("article") or soup.find("main") or soup.find("div", class_="content") or soup.body
        
        if article:
            text = article.get_text(separator="\n", strip=True)
        else:
            text = soup.get_text(separator="\n", strip=True)

        # Clean duplicate newlines
        clean_lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = "\n\n".join(clean_lines)
        word_count = len(clean_text.split())

        return {
            "success": True,
            "text": clean_text,
            "title": title or url,
            "word_count": word_count,
            "source_url": url,
            "metadata": {
                "title": title,
                "url": url,
                "paragraphs_count": len(clean_lines)
            },
            "file_type": "url"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": f"Error extracting URL content ({url}): {str(e)}",
            "title": url,
            "word_count": 0,
            "source_url": url,
            "metadata": {},
            "file_type": "url"
        }
