brew install pyenv
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
pyenv install 3.9.0
export PYENV_ROOT=../runtimes/python
cd runtimes/
../runtimes/python/python -m venv venv
cd ../
./runtimes/venv/bin/activate
pip install -r requirements.txt

npm install