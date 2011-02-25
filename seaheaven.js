// Card class.

var felt = null;

function make_card(img_src, x, y) {
	card = document.createElement("img");
	card.setAttribute("src", img_src);
	card.style.position = "absolute";
	card.style.left = x + "px";
	card.style.top = y + "px";
	felt.appendChild(card);
	return card;
	}

function seaheaven_start() {
	felt = document.getElementById("felt");

	card_1 = make_card("cards/bellot-fuchs-hart/clubs-2-150.png", 0, 0);
	card_2 = make_card("cards/bellot-fuchs-hart/clubs-a-150.png", 0, 60);
	}

