import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import ast
import math

ST_PONOVITEV = 5

def povpTabela(nacin,mapa):
	povpTabela = []
	for i in range(1,ST_PONOVITEV):
		with open(mapa+"/"+str(i)+".json") as data_file:
			data = json.load(data_file)
		count = 0
		for j in data:
			if count == 0: #prvo meritev izpustim
				count=count+1
				continue
			if i == 1:
				povpTabela.append(ast.literal_eval(j["data"])[nacin])
			else:
				povpTabela[count-1] += ast.literal_eval(j["data"])[nacin]
			count=count+1
			

	stIteracij = len(povpTabela)
	for i in range(0, stIteracij):
		povpTabela[i] /= ST_PONOVITEV
	return povpTabela

def varianca(p,tabela):
	v = 0
	for i in range(0,len(tabela)):
		v = v + pow(tabela[i] - p , 2)
	v /= len(tabela)
	return math.sqrt(v)

def prikazEnega(ime,nacin):
	povpTabela = []
	with open(ime) as data_file:
		data = json.load(data_file)	
	for j in data:
		povpTabela.append(ast.literal_eval(j["data"])[nacin])
	return povpTabela


def main():
	nacin = "ping" #ping,PorabRAM,DBTime
	#mapa = '100'   #100, 500, 1000, 2000
	tabela = []
	for mapa in [10,100,500,1000,2000]:
		pTabela = povpTabela(nacin, str(mapa))
		povp = sum(pTabela)/len(pTabela)
		tabela.append(povp)
		print("Povpr: "+str(povp)+"+/-: "+str(varianca(povp,pTabela)))
	# plt.plot([10,100,500,1000,2000],tabela,'b--o')
	# plt.ylabel('Velikost kopice [B]')
	# plt.xlabel('Delay [ms]')
	# plt.show()
	################### ali
	plt.plot(tabela)
	plt.plot(range(6,100),povpTabela(nacin, "10"), label='delay 10ms')
	plt.plot(range(6,100),povpTabela(nacin, "100"), label='delay 10ms')
	plt.plot(range(6,100),povpTabela(nacin, "500"), label='delay 10ms')
	plt.plot(range(6,100),povpTabela(nacin, "1000"), label='delay 10ms')
	plt.plot(range(6,100),povpTabela(nacin, "2000"), label='delay 2000ms')
	plt.legend(loc='down right')
	plt.ylabel('Cas [ms]')
	plt.xlabel('Velikost vrste')
	plt.xlim(6, 95)
	plt.show()
	# ################## ali
	# pTabela = prikazEnega("nov.json",nacin)
	# plt.plot(pTabela)
	# plt.show()



if __name__ == "__main__":
    main()