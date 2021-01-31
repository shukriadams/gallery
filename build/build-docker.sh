# fail on an any error
set -e

# when running on a CI system like travis, use switch "--ci"
# when running on a CI system like travis, use switch "--ci"
CI=0
DOCKERPUSH=0
while [ -n "$1" ]; do 
    case "$1" in
    --ci) CI=1 ;;
    --dockerpush) DOCKERPUSH=1 ;;
    esac 
    shift
done

mkdir -p .clone    

if [ $CI -eq 1 ]; then
    # if running on CI system, copy everything from src to .clone folder
    cp -R ./../src .clone/ 
else
    echo "Copying a bunch of stuff, this will likely take a while ...."

    rsync -v -r --exclude=node_modules --exclude=.* ./../src .clone 
fi

# build step 1: build frontend CSS/JS, and leaves it behind in .clone/src/dist folder. This build will yarn install dev modules, which we
# want to delete
docker run -v $(pwd)/.clone:/tmp/build shukriadams/node10build:0.0.3 sh -c "cd /tmp/build/src && yarn --no-bin-links --ignore-engines --production"

rm -rf .stage 
mkdir -p .stage 
cp -R .clone/src/* .stage 
tar -czvf .stage.tar.gz .stage 

docker build -t shukriadams/gallery . 

if [ $DOCKERPUSH -eq 1 ]; then
    TAG=$(git describe --tags --abbrev=0) 
    docker login -u $DOCKER_USER -p $DOCKER_PASSWORD 
    docker tag shukriadams/gallery:latest shukriadams/gallery:$TAG 
    docker push shukriadams/gallery:$TAG 
fi

echo "Build complete"