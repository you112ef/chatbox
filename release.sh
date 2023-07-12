set -ex

# 获取当前 git commit 的 tag
TAG=$(git describe --tags --exact-match)

# 如果不存在 tag，则使用 v0.0.1 替代
if [ -z "$TAG" ]; then
  TAG="v0.0.1"
fi

# 删除前面的 v，并打印数字
VERSION_NUMBER=${TAG#v}

echo release $VERSION_NUMBER

sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION_NUMBER\"/" ./release/app/package.json

echo release $VERSION_NUMBER

npm run electron:publish

mv ./release/app/package.json.bak ./release/app/package.json
