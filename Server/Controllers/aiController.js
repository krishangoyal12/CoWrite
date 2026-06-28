const generateAIResponse = async (req, res) => {
  try {
    const { text, task, docHTML } = req.body;
    
    let basePrompt;
    switch (task) {
      case 'summarize_document':
        basePrompt = `You are an expert summarizer. Review the following document and provide a concise, well-structured summary. The summary should capture the key points and main ideas.\n\nDOCUMENT:\n\n${text}`;
        break;
      case 'improve_document':
        basePrompt = `You are an expert editor. Review the following document and improve it. Fix any spelling and grammar mistakes, enhance clarity, and ensure it has a professional tone. Preserve the original structure (headings, paragraphs, lists, etc.) as much as possible.\n\nDOCUMENT:\n\n${text}`;
        break;
      case 'change_tone_professional':
        basePrompt = `Rewrite the following document in a more formal and professional tone. Preserve the original structure (headings, paragraphs, lists, etc.) as much as possible.\n\nDOCUMENT:\n\n${text}`;
        break;
      case 'bullet_summary':
        basePrompt = `Summarize the following text as a list of concise bullet points.\n\nTEXT:\n\n${text}`;
        break;
      case 'grammar_check':
        basePrompt = `Check the following text for grammar and spelling mistakes. Provide a corrected version, explaining the key changes made.\n\nTEXT:\n\n${text}`;
        break;
      case 'ask_document':
        basePrompt = `Based on the provided document content, answer the following question. Provide the answer as a clear, concise paragraph.\n\nDOCUMENT:\n\n${docHTML}\n\n---\n\nQUESTION: ${text}`;
        break;
      case 'format_document':
        basePrompt = `You are an expert document formatter. Review the following document and apply professional formatting. This includes adding appropriate headings (h1, h2, h3), using bold for emphasis, creating bulleted or numbered lists where appropriate, and structuring the content for readability.\n\nDOCUMENT:\n\n${text}`;
        break;
      default:
        basePrompt = text;
    }

    const instruction = "\n\nIMPORTANT: Your response must be only the raw HTML content for the result. Do not include any Markdown formatting (like ```, #, or *). Do not add any explanations, notes, or text outside of the final HTML content.";
    const prompt = basePrompt + instruction;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'AI API key not configured on server', success: false });
    }

    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from AI');
    }

    const data = await response.json();
    let result = data.candidates[0].content.parts[0].text;

    result = result.replace(/^```html\s*([\s\S]*?)```$/im, '$1')
      .replace(/^```\s*([\s\S]*?)```$/im, '$1')
      .trim();

    result = result
      .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/^(<br\s*\/?>|<p>\s*<\/p>)+/gi, '')
      .replace(/(<br\s*\/?>|<p>\s*<\/p>)+$/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return res.status(200).json({
      message: 'AI response generated successfully',
      data: result,
      success: true
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({
      message: 'Error generating AI response',
      error: error.message,
      success: false
    });
  }
};

module.exports = { generateAIResponse };
