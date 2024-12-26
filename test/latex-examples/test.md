以下是 2024.12.26 之前的测试结果

| file | chatbox | cherry-studio |
| ---- | -------- | ------------- |
| 1    | failed        | succeed            |
| 2    | failed        | succeed            |
| 3    | succeed        | succeed            |
| 4    | succeed        | succeed            |
| 5    | failed        | succeed            |
| 6    | failed        | succeed            |
| 7    | failed        | succeed            |
| 8    | failed        | succeed            |
| 9    | failed        | succeed            |
| 10    | succeed        | succeed            |
| 11    | succeed        | succeed            |
| 12    | succeed        | succeed            |
| 13    | succeed        | succeed            |
| 14    | succeed        | succeed            |
| 15    | succeed        | succeed            |
| 16    | succeed        | succeed            |
| 17    | succeed        | succeed            |
| 18    | failed        | failed            |
| 19    | succeed        | failed            |
| 20    | succeed        | succeed            |

2024.12.26 同步了 librechat 的实现，目前除了 18 （本身代码存在问题）的例子，其他全部成功。
因为可以很好的处理 $ 美元符号，所以优于 cherry-studio 的实现。
