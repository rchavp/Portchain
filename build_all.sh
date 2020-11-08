clear
echo "Building backend..."
npm run build
cd frontend
echo "Building frontend..."
npm run build
cd ..
echo "Build done."
sleep 2
npm run test

