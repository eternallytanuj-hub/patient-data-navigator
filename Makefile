.PHONY: install dev build build-dev preview serve start

install:
	npm install

dev:
	npm run dev

build:
	npm run build

build-dev:
	npm run build:dev

preview:
	npm run preview

serve:
	npm run serve

start: dev
