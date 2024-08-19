// 完全参考了： https://github.com/danny-avila/LibreChat/blob/main/client/src/utils/latex.ts

// Regex to check if the processed content contains any potential LaTeX patterns
const containsLatexRegex =
    /\\\(.*?\\\)|\\\[.*?\\\]|\$.*?\$|\\begin\{equation\}.*?\\end\{equation\}/;

// Regex for inline and block LaTeX expressions
const inlineLatex = new RegExp(/\\\((.+?)\\\)/, 'g');
const blockLatex = new RegExp(/\\\[(.*?[^\\])\\\]/, 'gs');

// Function to restore code blocks
const restoreCodeBlocks = (content: string, codeBlocks: string[]) => {
    return content.replace(/<<CODE_BLOCK_(\d+)>>/g, (match, index) => codeBlocks[index]);
};

// Regex to identify code blocks and inline code
const codeBlockRegex = /(```[\s\S]*?```|`.*?`)/g;

/**
 * 将 latex 的 \[ \] 风格转换为 markdown 的 $$ $$ 风格，并自动处理 $1.99 这样的情况。
 * 不会影响代码块和行内代码块中的文本。
 * @param _content 
 * @returns 
 */
export const processLaTeX = (_content: string) => {
    let content = _content;
    // Temporarily replace code blocks and inline code with placeholders
    const codeBlocks: string[] = [];
    let index = 0;
    content = content.replace(codeBlockRegex, (match) => {
        codeBlocks[index] = match;
        return `<<CODE_BLOCK_${index++}>>`;
    });

    // Escape dollar signs followed by a digit or space and digit
    // 处理了 $1.99 这样的情况
    let processedContent = content.replace(/(\$)(?=\s?\d)/g, '\\$');

    // If no LaTeX patterns are found, restore code blocks and return the processed content
    if (!containsLatexRegex.test(processedContent)) {
        return restoreCodeBlocks(processedContent, codeBlocks);
    }

    // Convert LaTeX expressions to a markdown compatible format
    processedContent = processedContent
        .replace(inlineLatex, (match: string, equation: string) => `$${equation}$`) // Convert inline LaTeX
        .replace(blockLatex, (match: string, equation: string) => `$$\n${equation}\n$$`); // Convert block LaTeX

    // Restore code blocks
    return restoreCodeBlocks(processedContent, codeBlocks);
}
