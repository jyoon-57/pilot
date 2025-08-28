const quotes = [
  {
    quote: 'Do not go gentle into that good night',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Old age should burn and rave at close of day',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Rage, rage against the dying of the light',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Because their words had forked no lightning they',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Do not go gentle into that good night',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Good men, the last wave by, crying how bright',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Their frail deeds might have danced in a green bay',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Rage, rage against the dying of the light',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Wild men who caught and sang the sun in flight',
    author: 'Dylan Thomas',
  },
  {
    quote: 'And learn, too late, they grieved it on its way',
    author: 'Dylan Thomas',
  },
  {
    quote: 'Do not go gentle into that good night',
    author: 'Dylan Thomas',
  },
];

const quote = document.querySelector('#quote span:first-child');
const author = document.querySelector('#quote span:last-child');

function getRandomQuote() {
  const randomNumber = Math.round(Math.random() * (quotes.length - 1));
  quote.innerText = quotes[randomNumber].quote;
  author.innerText = quotes[randomNumber].author;
}

getRandomQuote();
