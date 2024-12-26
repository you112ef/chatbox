**公式**：

对于一个输入张量`x`，RMSNorm的计算过程如下：

1. 计算均方根：$g = \sqrt{\frac{1}{H} \sum_{i=1}^{H} x_i^2}$
2. 归一化：$\hat{x}_i = \frac{x_i}{g + \epsilon}$
3. 缩放：$y_i = \alpha \hat{x}_i$