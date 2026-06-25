import os, sys
print("Текущая рабочая директория:", os.getcwd())
print("Python ищет модули в путях:")
for p in sys.path:
    print("  ", p)
