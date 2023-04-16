cd runtimes\
..\runtimes\python\python.exe -m venv venv

cd ..\
call .\runtimes\venv\Scripts\activate
pip install -r requirements.txt

npm install