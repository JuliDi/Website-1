SHELL=bash

REFS=$(shell sed -e 's/^/cache\//g' assets/publications.txt | sed -e 's/$$/-ref.shtml/g')

.PHONY: publications
publications: ${REFS}

%.shtml:
	mkdir -p ./cache
	$(eval FILE=$(shell echo $@ | sed -e 's/cache\///g'))
	echo ${FILE}
	cp /home/basti/src/blog/bib/inc/${FILE} ./cache/
	perl -p -i -e "s#href=\"/#href=\"https://www.bastibl.net/#g" $@
	perl -p -i -e "s#src=\"/#src=\"https://www.bastibl.net/#g" $@

.PHOHY: upload
upload:
	rsync -az --progress -e ssh --delete dist/ basti@fleark.de:/srv/www/futuresdr.org/
