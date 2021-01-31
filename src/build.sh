# This script is called from buildWithDocker.sh, and its CWD context is its parent folder.
# CWD is set by Dockerfile's "WORKDIR" command
npm install
bower install
grunt setup
grunt build

cd server/Manafeed
dotnet restore
# build both debug and release, which one we run can be set in supervisor.conf
dotnet publish -c Debug
# don't build release for now, if needed we can flip to this later
#dotnet publish -c Release
