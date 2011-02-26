// Card class.

var felt = null;
var card_images = null;

var suit_names = [ "clubs", "diamonds", "hearts", "spades" ];

function Card(suit, rank, x, y) {
	this.suit = suit;
	this.rank = rank;
	this.img = document.createElement("img");
	this.img.setAttribute("src", card_images.image_url_for(suit, rank));
	this.img.style.position = "absolute";
	this.img.style.left = x + "px";
	this.img.style.top = y + "px";
	felt.appendChild(this.img);
	}

Card.prototype.move_to = function(x,y) {
	img.style.left = x + "px";
	img.style.top = y + "px";
	}


function CardImages(name) {
	this.name = name;
	}

CardImages.prototype.image_url_for = function(suit, rank) {
	return "cards/" + this.name + "/" + this.filename_for(suit, rank);
	}

bellot_fuchs_hart = new CardImages("bellot-fuchs-hart");
bellot_fuchs_hart.rank_names = [ "a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "a", "j", "q", "k" ];
bellot_fuchs_hart.filename_for = function(suit, rank) {
	return suit_names[suit] + "-" + this.rank_names[rank] + "-150.png";
	}

function seaheaven_start() {
	felt = document.getElementById("felt");
	card_images = bellot_fuchs_hart;

	card_1 = new Card(0, 1, 0, 0);
	card_2 = new Card(0, 0, 0, 60);
	}

