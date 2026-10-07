const Groq = require('groq-sdk');

const generateAIResponse = async (req, res) => {
  try {
    const { text, task, docHTML } = req.body;
    
    let basePrompt;
    switch (task) {
      case 'summarize_document':
        basePrompt = `You are an expert summarizer. Review the following document and provide a concise, well-structured summary. Start the output directly with <h3>Summary:</h3> followed by key takeaway paragraphs or bullet points capturing the main ideas.\n\nDOCUMENT:\n\n${text}`;
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
        basePrompt = `Check the following text for grammar, spelling, and punctuation errors. Return ONLY the fully corrected document text preserving the original paragraphs and structure. Do NOT add notes, explanations, or commentary about what you changed.\n\nTEXT:\n\n${text}`;
        break;
      case 'ask_document':
        basePrompt = `Based on the provided document content, answer the following question. Provide the answer as a clear, concise paragraph.\n\nDOCUMENT:\n\n${docHTML}\n\n---\n\nQUESTION: ${text}`;
        break;
      case 'apply_critique':
        basePrompt = `You are an expert document editor. Below is a document and a critique/improvement recommendations note.
Apply the recommended corrections, enhancements, and fixes directly to the document. 
Return ONLY the revised document text/HTML with the improvements applied. Do NOT output the critique itself, do NOT output explanations of what you changed, and do NOT include any introductory or concluding meta commentary.

DOCUMENT:
${docHTML || text}

CRITIQUE & RECOMMENDATIONS TO APPLY:
${text}`;
        break;
      case 'format_document':
        basePrompt = `You are an expert document formatter. Review the following document and apply professional formatting. This includes adding appropriate headings (h1, h2, h3), using bold for emphasis, creating bulleted or numbered lists where appropriate, and structuring the content for readability.\n\nDOCUMENT:\n\n${text}`;
        break;
      default:
        basePrompt = text;
    }

    const instruction = `

FORMATTING REQUIREMENTS:
- Output clean, standard HTML snippets only (e.g. <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>).
- Write seamlessly as native document prose. Do NOT write meta-introductions like "Here is the summary:", "Sure, here is your content:", or conversational greetings.
- Do NOT over-bold every other word. Use <strong> only for legitimate sub-headers or key terms.
- Use simple, clean paragraphs (<p>...</p>) without empty paragraphs or raw <br> spacers.
- Do NOT include any Markdown tags, backticks (\`\`\`), or <!DOCTYPE>/<html>/<body> tags.`;
    const prompt = basePrompt + instruction;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GROQ_API_KEY not configured on server', success: false });
    }

    const groq = new Groq({ apiKey });

    // Fast, verified models on Groq
    const candidateModels = [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b'
    ];

    let completion = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an invisible, expert document ghostwriter and editor integrated into a collaborative rich-text editor. Your goal is to write natural, eloquent, professional document prose that matches the formatting and flow of a human-written document. Never introduce your response or include meta commentary. Directly produce the document content in clean, semantic HTML.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: model,
          temperature: 0.5,
          max_tokens: 3000
        });
        if (completion?.choices?.[0]?.message?.content) {
          break;
        }
      } catch (err) {
        console.warn(`[Groq] Model ${model} failed, attempting next fallback... Reason:`, err.message);
        lastError = err;
      }
    }

    if (!completion?.choices?.[0]?.message?.content) {
      throw lastError || new Error('All AI models failed to generate response');
    }

    let result = completion.choices[0].message.content || '';

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

const predictTextCompletion = async (req, res) => {
  try {
    const { prefix, suffix = '', docTitle = '' } = req.body;

    if (!prefix || typeof prefix !== 'string' || prefix.trim().length < 3) {
      return res.status(200).json({
        success: true,
        data: ''
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GROQ_API_KEY not configured on server', success: false });
    }

    const groq = new Groq({ apiKey });

    // Keep prompt minimal to stay well under Groq ITPM (Input Tokens Per Minute) limit
    const recentPrefix = prefix.slice(-120);

    const systemPrompt = 'You are an autocomplete engine. Continue the sentence naturally in 3 to 12 words. Output ONLY the raw continuation text. Do not repeat prefix.';

    const userPrompt = `Continue: "${recentPrefix}"`;

    const candidateModels = [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b',
      'allam-2-7b'
    ];

    let completionText = '';
    for (const model of candidateModels) {
      try {
        const response = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model,
          temperature: 0.2,
          max_tokens: 20,
          stop: ['\n', '"', '<|eot_id|>', '\r']
        });

        const raw = response.choices?.[0]?.message?.content || '';
        if (raw) {
          completionText = raw
            .replace(/^["'`]|["'`]$/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/<[^>]*>/g, '')
            .trimEnd();
          break;
        }
      } catch (err) {
        if (err.status !== 429) {
          console.warn(`[predictTextCompletion] Model ${model} failed:`, err.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: completionText
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: ''
    });
  }
};

module.exports = { generateAIResponse, predictTextCompletion };

