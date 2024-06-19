# https://www.gnu.org/software/make/manual/make.html

# make WEBPACK_MODE=production install=1 && make test 
# make WEBPACK_MODE=development && make test 

.SILENT: 

# -O https://www.gnu.org/software/make/manual/html_node/Parallel-Output.html
MAKEFLAGS += -O -j 20 # https://www.gnu.org/software/make/manual/html_node/Parallel.html

doc: doc-diagrams

doc-diagrams: 
	npx arkit ../Signal-Desktop/app/ -o ./doc/guides/assets/architecture/app-architecture.png
	npx arkit -f ../Signal-Desktop/app/main.ts -d ../Signal-Desktop/app -o ./doc/guides/assets/architecture/electron-app-architecture.png
	# npx arkit -f ../Signal-Desktop/ts/background.ts -d ../Signal-Desktop/ts -o ./doc/guides/assets/architecture/background-architecture.png

