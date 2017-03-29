import subprocess
import datetime
import re

# UREDI - Pot do ukaza 'ab', pride z 'apache' streznikom 
AB_PATH = "C:/wamp/bin/apache/apache2.4.17/bin/ab.exe"
# UREDI - Pot do root mape te skripte
ROOT_PATH = "E:/matja/Google Drive/Fri/Fri 2015_2016/S02/ZZRS/ab"

# UREDI
AB_N = "10" # <- koliko odjemalcev
AB_C = "2"  # <- koliko socasnih odjemalcev
AB_URL = "http://mavpi.ddns.net/"

AB_OUT = datetime.datetime.today().__format__("%Y%m%dT%H%M%S")
AB_OUT_PATH = ROOT_PATH + "/log/" + AB_OUT + ".log"
AB_CSV_PATH = ROOT_PATH + "/data.csv"

# IZVRSI AB UKAZ
AB = AB_PATH + " -n " + AB_N + " -c " + AB_C + " " + AB_URL + " > \"" + AB_OUT_PATH + "\""
subprocess.call(AB, shell=True)

# ODPRI DATOTEKO
ab_out = open(AB_OUT_PATH, "r+")
# PRIDOBI KLJUCNE VRSTICE
lines = ab_out.readlines()[14:25]
lines.pop(4)
ab_out.seek(0)
ab_out.truncate()
ab_out.writelines(lines)
# ZAPRI DATOTEKO
ab_out.close()

ab_csv = open(AB_CSV_PATH, "a")
# PRECISTI PODATKE
csv = []
for line in lines:
    match = re.search(r"[\d.]+", line)
    if match:
        csv.append(match.group())
csv = ",".join(csv)
ab_csv.write(datetime.datetime.today().isoformat()+","+csv+"\n")
ab_csv.close()

# PRIMER LOG DATOTEKE
# ===================
#
# Concurrency Level:      2
# Time taken for tests:   1.085 seconds
# Complete requests:      10
# Failed requests:        9
# Total transferred:      113696 bytes
# HTML transferred:       107606 bytes
# Requests per second:    9.21 [#/sec] (mean)
# Time per request:       217.059 [ms] (mean)
# Time per request:       108.530 [ms] (mean, across all concurrent requests)
# Transfer rate:          102.31 [Kbytes/sec] received