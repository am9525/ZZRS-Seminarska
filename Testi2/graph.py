import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import ast
import math

def prikazEnega(ime,nacin):
	povpTabela = []
	with open(ime) as data_file:
		data = json.load(data_file)	
	for j in data:
		povpTabela.append(ast.literal_eval(j["data"])[nacin])
	return povpTabela


def main():
	nacin = "ping" #ping,PorabRAM,DBTime
	pTabela = prikazEnega("delay500.json",nacin)
	plt.plot(pTabela, label='delay 500ms')	
	pTabela = prikazEnega("delay1000.json",nacin)
	plt.plot(pTabela, label='delay 1000ms')
	plt.legend(loc='down right')
	plt.ylabel('Cas [ms]')
	plt.xlabel('Velikost vrste')
	plt.show()



if __name__ == "__main__":
    main()