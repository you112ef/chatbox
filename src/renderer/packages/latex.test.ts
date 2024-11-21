// 完全参考了 https://github.com/danny-avila/LibreChat/blob/main/client/src/utils/latex.spec.ts

import { processLaTeX } from './latex'

describe('processLaTeX', () => {
    test('returns the same string if no LaTeX patterns are found', () => {
        const content = 'This is a test string without LaTeX'
        expect(processLaTeX(content)).toBe(content)
    })

    test('converts inline LaTeX expressions correctly', () => {
        const content = 'This is an inline LaTeX expression: \\(x^2 + y^2 = z^2\\)'
        const expected = 'This is an inline LaTeX expression: $x^2 + y^2 = z^2$'
        expect(processLaTeX(content)).toBe(expected)
    })

    test('converts block LaTeX expressions correctly', () => {
        const content = 'This is a block LaTeX expression: \\[E = mc^2\\]'
        const expected = 'This is a block LaTeX expression: $$\nE = mc^2\n$$'
        expect(processLaTeX(content)).toBe(expected)
    })

    test('converts mixed LaTeX expressions correctly', () => {
        const content = 'Inline \\(a + b = c\\) and block \\[x^2 + y^2 = z^2\\]'
        const expected = 'Inline $a + b = c$ and block $$\nx^2 + y^2 = z^2\n$$'
        expect(processLaTeX(content)).toBe(expected)
    })

    test('escapes dollar signs followed by a digit or space and digit', () => {
        const content = 'Price is $50 and $ 100'
        const expected = 'Price is \\$50 and \\$ 100'
        expect(processLaTeX(content)).toBe(expected)
    })

    test('handles strings with no content', () => {
        const content = ''
        expect(processLaTeX(content)).toBe('')
    })

    test('does not alter already valid inline Markdown LaTeX', () => {
        const content = 'This is a valid inline LaTeX: $x^2 + y^2 = z^2$'
        expect(processLaTeX(content)).toBe(content)
    })

    test('does not alter already valid block Markdown LaTeX', () => {
        const content = 'This is a valid block LaTeX: $$E = mc^2$$'
        expect(processLaTeX(content)).toBe(content)
    })

    test('correctly processes a mix of valid Markdown LaTeX and LaTeX patterns', () => {
        const content = 'Valid $a + b = c$ and LaTeX to convert \\(x^2 + y^2 = z^2\\)'
        const expected = 'Valid $a + b = c$ and LaTeX to convert $x^2 + y^2 = z^2$'
        expect(processLaTeX(content)).toBe(expected)
    })

    test('correctly handles strings with LaTeX and non-LaTeX dollar signs', () => {
        const content = 'Price $100 and LaTeX \\(x^2 + y^2 = z^2\\)'
        const expected = 'Price \\$100 and LaTeX $x^2 + y^2 = z^2$'
        expect(processLaTeX(content)).toBe(expected)
    })

    test('ignores non-LaTeX content enclosed in dollar signs', () => {
        const content = 'This is not LaTeX: $This is just text$'
        expect(processLaTeX(content)).toBe(content)
    })

    test('correctly processes complex block LaTeX with line breaks', () => {
        const complexBlockLatex = `Certainly! Here's an example of a mathematical formula written in LaTeX:

\\[
\\sum_{i=1}^{n} \\left( \\frac{x_i}{y_i} \\right)^2
\\]
    
This formula represents the sum of the squares of the ratios of \\(x\\) to \\(y\\) for \\(n\\) terms, where \\(x_i\\) and \\(y_i\\) represent the values of \\(x\\) and \\(y\\) for each term.

LaTeX is a typesetting system commonly used for mathematical and scientific documents. It provides a wide range of formatting options and symbols for expressing mathematical expressions.`
        const expectedOutput = `Certainly! Here's an example of a mathematical formula written in LaTeX:

$$
\\sum_{i=1}^{n} \\left( \\frac{x_i}{y_i} \\right)^2
$$
    
This formula represents the sum of the squares of the ratios of $x$ to $y$ for $n$ terms, where $x_i$ and $y_i$ represent the values of $x$ and $y$ for each term.

LaTeX is a typesetting system commonly used for mathematical and scientific documents. It provides a wide range of formatting options and symbols for expressing mathematical expressions.`
        expect(processLaTeX(complexBlockLatex)).toBe(expectedOutput)
    })

    describe('processLaTeX with code block exception', () => {
        test('ignores dollar signs inside inline code', () => {
            const content = 'This is inline code: `$100`'
            expect(processLaTeX(content)).toBe(content)
        })

        test('ignores dollar signs inside multi-line code blocks', () => {
            const content = '```\n$100\n# $1000\n```'
            expect(processLaTeX(content)).toBe(content)
        })

        test('processes LaTeX outside of code blocks', () => {
            const content =
                'Outside \\(x^2 + y^2 = z^2\\) and inside code block: ```\n$100\n# $1000\n``` or `\\(x^2 + y^2 = z^2\\) $100`'
            const expected =
                'Outside $x^2 + y^2 = z^2$ and inside code block: ```\n$100\n# $1000\n``` or `\\(x^2 + y^2 = z^2\\) $100`'
            expect(processLaTeX(content)).toBe(expected)
        })

        test('real case 1', () => {
            const content =
                '\n好的，下面是详细的推导过程。\n\n### 一阶矩估计的推导\n\nAdam优化器中一阶矩估计的更新公式为：\n[ m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t ]\n其中 ( g_t ) 是在时间步 ( t ) 的梯度。\n\n#### 偏差校正\n\n由于 ( m_t ) 是指数加权移动平均（EWMA），在初始阶段会有偏差。因此，我们需要进行偏差校正：\n[ hat{m}_t = \frac{m_t}{1 - \beta_1^t} ]\n\n#### 期望值的推导\n\n首先，我们考虑 ( m_t ) 的期望值。假设初始时 ( m_0 = 0 )，我们有：\n[ m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t ]\n\n递归展开：\n[ m_t = (1 - \beta_1) sum_{i=0}^{t-1} \beta_1^i g_{t-i} ]\n\n考虑到 ( g_t ) 是梯度的估计值，我们有：\n[ mathbb{E}(m_t) = (1 - \beta_1) sum_{i=0}^{t-1} \beta_1^i mathbb{E}(g_{t-i}) ]\n\n在训练过程中，假设梯度的期望值是稳定的，即：\n[ mathbb{E}(g_t) = \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n因此：\n[ mathbb{E}(m_t) = (1 - \beta_1) sum_{i=0}^{t-1} \beta_1^i \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n这是一个等比数列的和：\n[ mathbb{E}(m_t) = (1 - \beta_1) \frac{1 - \beta_1^t}{1 - \beta_1} \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n[ mathbb{E}(m_t) = (1 - \beta_1^t) \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n进行偏差校正后：\n[ mathbb{E}(hat{m}_t) = mathbb{E}left(\frac{m_t}{1 - \beta_1^t}\right) = \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n### 二阶矩估计的推导\n\nAdam优化器中二阶矩估计的更新公式为：\n[ v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2 ]\n\n#### 偏差校正\n\n由于 ( v_t ) 也是指数加权移动平均（EWMA），在初始阶段会有偏差。因此，我们需要进行偏差校正：\n[ hat{v}_t = \frac{v_t}{1 - \beta_2^t} ]\n\n#### 期望值的推导\n\n首先，我们考虑 ( v_t ) 的期望值。假设初始时 ( v_0 = 0 )，我们有：\n[ v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2 ]\n\n递归展开：\n[ v_t = (1 - \beta_2) sum_{i=0}^{t-1} \beta_2^i g_{t-i}^2 ]\n\n考虑到 ( g_t ) 是梯度的估计值，我们有：\n[ mathbb{E}(v_t) = (1 - \beta_2) sum_{i=0}^{t-1} \beta_2^i mathbb{E}(g_{t-i}^2) ]\n\n假设梯度的期望值是稳定的，即：\n[ mathbb{E}(g_t^2) = (\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t) ]\n\n因此：\n[ mathbb{E}(v_t) = (1 - \beta_2) sum_{i=0}^{t-1} \beta_2^i left((\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t)\right) ]\n\n这是一个等比数列的和：\n[ mathbb{E}(v_t) = (1 - \beta_2) \frac{1 - \beta_2^t}{1 - \beta_2} left((\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t)\right) ]\n[ mathbb{E}(v_t) = (1 - \beta_2^t) left((\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t)\right) ]\n\n进行偏差校正后：\n[ mathbb{E}(hat{v}_t) = mathbb{E}left(\frac{v_t}{1 - \beta_2^t}\right) = (\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t) ]\n\n其中 (\text{Var}(g_t)) 表示梯度的方差项，记为 ( s_{t,j}^2 )。\n\n### 总结\n\n通过上述推导，我们得到了Adam优化器中一阶和二阶矩估计的期望值的近似：\n[ hat{m}_t \to mathbb{E}(hat{m}_t) approx \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n[ hat{v}_t \to mathbb{E}(hat{v}_t) approx (\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + s_{t,j}^2 ]\n\n这些期望值帮助我们理解Adam优化器在训练过程中如何调整参数，以提高优化效率和稳定性。\n'
            const expected =
                '\n好的，下面是详细的推导过程。\n\n### 一阶矩估计的推导\n\nAdam优化器中一阶矩估计的更新公式为：\n[ m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t ]\n其中 ( g_t ) 是在时间步 ( t ) 的梯度。\n\n#### 偏差校正\n\n由于 ( m_t ) 是指数加权移动平均（EWMA），在初始阶段会有偏差。因此，我们需要进行偏差校正：\n[ hat{m}_t = \frac{m_t}{1 - \beta_1^t} ]\n\n#### 期望值的推导\n\n首先，我们考虑 ( m_t ) 的期望值。假设初始时 ( m_0 = 0 )，我们有：\n[ m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t ]\n\n递归展开：\n[ m_t = (1 - \beta_1) sum_{i=0}^{t-1} \beta_1^i g_{t-i} ]\n\n考虑到 ( g_t ) 是梯度的估计值，我们有：\n[ mathbb{E}(m_t) = (1 - \beta_1) sum_{i=0}^{t-1} \beta_1^i mathbb{E}(g_{t-i}) ]\n\n在训练过程中，假设梯度的期望值是稳定的，即：\n[ mathbb{E}(g_t) = \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n因此：\n[ mathbb{E}(m_t) = (1 - \beta_1) sum_{i=0}^{t-1} \beta_1^i \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n这是一个等比数列的和：\n[ mathbb{E}(m_t) = (1 - \beta_1) \frac{1 - \beta_1^t}{1 - \beta_1} \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n[ mathbb{E}(m_t) = (1 - \beta_1^t) \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n进行偏差校正后：\n[ mathbb{E}(hat{m}_t) = mathbb{E}left(\frac{m_t}{1 - \beta_1^t}\right) = \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n\n### 二阶矩估计的推导\n\nAdam优化器中二阶矩估计的更新公式为：\n[ v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2 ]\n\n#### 偏差校正\n\n由于 ( v_t ) 也是指数加权移动平均（EWMA），在初始阶段会有偏差。因此，我们需要进行偏差校正：\n[ hat{v}_t = \frac{v_t}{1 - \beta_2^t} ]\n\n#### 期望值的推导\n\n首先，我们考虑 ( v_t ) 的期望值。假设初始时 ( v_0 = 0 )，我们有：\n[ v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2 ]\n\n递归展开：\n[ v_t = (1 - \beta_2) sum_{i=0}^{t-1} \beta_2^i g_{t-i}^2 ]\n\n考虑到 ( g_t ) 是梯度的估计值，我们有：\n[ mathbb{E}(v_t) = (1 - \beta_2) sum_{i=0}^{t-1} \beta_2^i mathbb{E}(g_{t-i}^2) ]\n\n假设梯度的期望值是稳定的，即：\n[ mathbb{E}(g_t^2) = (\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t) ]\n\n因此：\n[ mathbb{E}(v_t) = (1 - \beta_2) sum_{i=0}^{t-1} \beta_2^i left((\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t)\right) ]\n\n这是一个等比数列的和：\n[ mathbb{E}(v_t) = (1 - \beta_2) \frac{1 - \beta_2^t}{1 - \beta_2} left((\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t)\right) ]\n[ mathbb{E}(v_t) = (1 - \beta_2^t) left((\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t)\right) ]\n\n进行偏差校正后：\n[ mathbb{E}(hat{v}_t) = mathbb{E}left(\frac{v_t}{1 - \beta_2^t}\right) = (\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + \text{Var}(g_t) ]\n\n其中 (\text{Var}(g_t)) 表示梯度的方差项，记为 ( s_{t,j}^2 )。\n\n### 总结\n\n通过上述推导，我们得到了Adam优化器中一阶和二阶矩估计的期望值的近似：\n[ hat{m}_t \to mathbb{E}(hat{m}_t) approx \nabla_{W_j} mathcal{L}(W^{(t)}) ]\n[ hat{v}_t \to mathbb{E}(hat{v}_t) approx (\nabla_{W_j} mathcal{L}(W^{(t)}))^2 + s_{t,j}^2 ]\n\n这些期望值帮助我们理解Adam优化器在训练过程中如何调整参数，以提高优化效率和稳定性。\n'
            expect(processLaTeX(content)).toBe(expected)
        })
        test('real case 2', () => {
            const content =
                '\nNeRF（Neural Radiance Fields）是一种用于合成新视角图像的神经网络模型。其核心思想是利用神经网络来表示三维场景中的辐射场。NeRF的计算过程主要包括以下几个步骤：\n\n1. **输入参数**：NeRF的输入通常包括三维空间中的一个点 ((x, y, z)) 和一个视角方向 ((\theta, phi))。\n\n2. **网络结构**：NeRF使用一个多层感知机（MLP）来对输入进行编码。网络的输入是三维坐标和视角方向，输出是该点的颜色（RGB）和体积密度（(sigma)）。\n\n3. **体积渲染公式**：NeRF使用体积渲染来合成图像。对于每条光线，采样一系列点，计算每个点的颜色和密度，然后通过以下公式进行合成：\n\n   [\n   C(r) = int_{t_n}^{t_f} T(t) cdot sigma(t) cdot c(t) , dt\n   ]\n\n   其中，(T(t) = expleft(-int_{t_n}^{t} sigma(s) , ds\right)) 表示从光线起点到点 (t) 的透射率，(sigma(t)) 是体积密度，(c(t)) 是颜色。\n\n4. **离散化计算**：实际计算中，积分通过离散化来近似：\n\n   [\n   C(r) approx sum_{i=1}^{N} T_i cdot (1 - exp(-sigma_i delta_i)) cdot c_i\n   ]\n\n   其中，(delta_i) 是相邻采样点之间的距离，(T_i) 是从光线起点到第 (i) 个采样点的累积透射率。\n\n通过上述过程，NeRF能够生成高质量的三维场景图像。其关键在于通过优化网络参数，使得合成的图像与真实图像之间的差异最小。\n\n'
            const expected =
                '\nNeRF（Neural Radiance Fields）是一种用于合成新视角图像的神经网络模型。其核心思想是利用神经网络来表示三维场景中的辐射场。NeRF的计算过程主要包括以下几个步骤：\n\n1. **输入参数**：NeRF的输入通常包括三维空间中的一个点 ((x, y, z)) 和一个视角方向 ((\theta, phi))。\n\n2. **网络结构**：NeRF使用一个多层感知机（MLP）来对输入进行编码。网络的输入是三维坐标和视角方向，输出是该点的颜色（RGB）和体积密度（(sigma)）。\n\n3. **体积渲染公式**：NeRF使用体积渲染来合成图像。对于每条光线，采样一系列点，计算每个点的颜色和密度，然后通过以下公式进行合成：\n\n   [\n   C(r) = int_{t_n}^{t_f} T(t) cdot sigma(t) cdot c(t) , dt\n   ]\n\n   其中，(T(t) = expleft(-int_{t_n}^{t} sigma(s) , ds\right)) 表示从光线起点到点 (t) 的透射率，(sigma(t)) 是体积密度，(c(t)) 是颜色。\n\n4. **离散化计算**：实际计算中，积分通过离散化来近似：\n\n   [\n   C(r) approx sum_{i=1}^{N} T_i cdot (1 - exp(-sigma_i delta_i)) cdot c_i\n   ]\n\n   其中，(delta_i) 是相邻采样点之间的距离，(T_i) 是从光线起点到第 (i) 个采样点的累积透射率。\n\n通过上述过程，NeRF能够生成高质量的三维场景图像。其关键在于通过优化网络参数，使得合成的图像与真实图像之间的差异最小。\n\n'
            expect(processLaTeX(content)).toBe(expected)
        })
    })
})
