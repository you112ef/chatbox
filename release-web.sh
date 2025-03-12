set -e

npm install

rm -rf release/app/dist/renderer
npm run build:web

_imageName="registry.jellow.site/iftech/chatbox-webapp"
_version=`git rev-parse --short HEAD`
_imageTag="$_imageName:$_version"

echo "image tag: $_imageTag"

echo

echo "start docker build: $_imageTag"
docker build . -f Dockerfile --platform linux/amd64 -t $_imageTag

echo

echo "start docker push: $_imageTag"
docker push $_imageTag

echo

echo "======================================"
echo $_imageTag
echo "======================================"
