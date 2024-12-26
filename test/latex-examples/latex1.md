有时候有些Latex无法正常渲染，如下：

To calculate the total number of trainable parameters in the provided `WRN` (Wide Residual Network) model, we'll break down each layer and compute its parameters step-by-step. Here's a comprehensive breakdown:

### 1. Initial Convolution Layer

```python
self.conv = layers.Conv2D(16, kernel_size=3, padding='same')
```

- **Filters:** 16
- **Kernel Size:** 3x3
- **Input Channels:** 3 (assuming RGB images)
- **Parameters:**
\[
(3 \times 3 \times 3) \times 16 + 16 = 432 + 16 = 448
\]

### 2. Residual Blocks (`ResBlock`)

Assuming each `ResBlock` consists of:
- Two convolutional layers (`conv1` and `conv2`)
- A shortcut connection (if `filters_in != filters_out` or `downsample=True`)

#### a. ResBlock1: `ResBlock(16, 64, False)`

- **Conv1:**
\[
(3 \times 3 \times 16) \times 64 + 64 = 2,304 + 64 = 2,368
\]
- **Conv2:**
\[
(3 \times 3 \times 64) \times 64 + 64 = 11,664 + 64 = 11,728
\]
- **Shortcut (since 16 ≠ 64):**
\[
(1 \times 1 \times 16) \times 64 + 64 = 1,024 + 64 = 1,088
\]
- **Total ResBlock1:**
\[
2,368 + 11,728 + 1,088 = 15,184
\]

#### b. ResBlock2: `ResBlock(64, 64, False)`

- **Conv1:**
\[
(3 \times 3 \times 64) \times 64 + 64 = 11,664 + 64 = 11,728
\]
- **Conv2:**
\[
(3 \times 3 \times 64) \times 64 + 64 = 11,664 + 64 = 11,728
\]
- **No Shortcut (since 64 = 64 and no downsampling)**
- **Total ResBlock2:**
\[
11,728 + 11,728 = 23,456
\]

#### c. ResBlock3: `ResBlock(64, 128, True)`

- **Conv1:**
\[
(3 \times 3 \times 64) \times 128 + 128 = 73,728 + 128 = 73,856
\]
- **Conv2:**
\[
(3 \times 3 \times 128) \times 128 + 128 = 147,456 + 128 = 147,584
\]
- **Shortcut (since 64 ≠ 128 or downsampling):**
\[
(1 \times 1 \times 64) \times 128 + 128 = 8,192 + 128 = 8,320
\]
- **Total ResBlock3:**
\[
73,856 + 147,584 + 8,320 = 229,760
\]

#### d. ResBlock4: `ResBlock(128, 128, False)`

- **Conv1:**
\[
(3 \times 3 \times 128) \times 128 + 128 = 147,456 + 128 = 147,584
\]
- **Conv2:**
\[
(3 \times 3 \times 128) \times 128 + 128 = 147,456 + 128 = 147,584
\]
- **No Shortcut (since 128 = 128 and no downsampling)**
- **Total ResBlock4:**
\[
147,584 + 147,584 = 295,168
\]

#### e. ResBlock5: `ResBlock(128, 256, True)`

- **Conv1:**
\[
(3 \times 3 \times 128) \times 256 + 256 = 294,912 + 256 = 295,168
\]
- **Conv2:**
\[
(3 \times 3 \times 256) \times 256 + 256 = 589,824 + 256 = 590,080
\]
- **Shortcut (since 128 ≠ 256 or downsampling):**
\[
(1 \times 1 \times 128) \times 256 + 256 = 32,768 + 256 = 33,024
\]
- **Total ResBlock5:**
\[
295,168 + 590,080 + 33,024 = 918,272
\]

#### f. ResBlock6: `ResBlock(256, 256, False)`

- **Conv1:**
\[
(3 \times 3 \times 256) \times 256 + 256 = 589,824 + 256 = 590,080
\]
- **Conv2:**
\[
(3 \times 3 \times 256) \times 256 + 256 = 589,824 + 256 = 590,080
\]
- **No Shortcut (since 256 = 256 and no downsampling)**
- **Total ResBlock6:**
\[
590,080 + 590,080 = 1,180,160
\]

### 3. Dense Layer

```python
self.dense = layers.Dense(num_classes=10)
```

- **Input Units:** 256 (from `GlobalAveragePooling2D`)
- **Output Units:** 10
- **Parameters:**
\[
256 \times 10 + 10 = 2,560 + 10 = 2,570
\]

### 4. Summing All Parameters

| Layer | Parameters |
|---------------------|------------|
| Initial Conv | 448 |
| ResBlock1 | 15,184 |
| ResBlock2 | 23,456 |
| ResBlock3 | 229,760 |
| ResBlock4 | 295,168 |
| ResBlock5 | 918,272 |
| ResBlock6 | 1,180,160 |
| Dense | 2,570 |
| **Total** | **2,743,538** |

**Total Trainable Parameters:** **2,743,538**

---

**Note:** The exact number of parameters depends on the specific implementation details of the `ResBlock` class. The above calculation assumes a standard residual block with two convolutional layers and a possible shortcut convolution when necessary.

email
michaelyzy@outlook.com

platform
MacOS, iOS

version
v1.5.1
