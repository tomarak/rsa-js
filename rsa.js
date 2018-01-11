

const PRIME = 0
const NON_PRIME = 1
const UNKNOWN = 2

function sieve(max, min) {
  min = min || 2;


  // Int8Array is really fast
  var numbers = new Int8Array(max + 1);

  // all evens are non-primes
  for (var i = 1; i < max + 1; i += 2) {
    numbers[i] = UNKNOWN;
  }
  for (var i = 0; i < max + 1; i += 2) {
    numbers[i] = NON_PRIME;
  }

  // mark the first two
  numbers[0] = NON_PRIME;
  numbers[1] = NON_PRIME;

  var primeCount = 0;

  // use the seive of Eratosthenes to find all primes up to max
  for (var prime = 2; prime <= max;) {
    numbers[prime] = PRIME;
    if (prime >= min) ++primeCount;
    // mark all numbers divisible by that prime
    for (var i = prime * 2; i <= max; i += prime) {
      numbers[i] = NON_PRIME;
    }
    // advance to next prime
    while (prime <= max && numbers[prime] !== UNKNOWN) ++prime;
  }

  var primes = new Array(primeCount);
  var pi = 0;
  for (var i = min; i < max + 1; ++i) {
    if (numbers[i] === PRIME) {
      primes[pi] = i;
      ++pi;
    }
  }

  return primes;
}

let fetchRandomNumbers = async() => {
  const path = 'https://www.random.org/integers/?num=3&min=100&max=10000&col=1&base=10&format=plain&rnd=new'
  let result = await fetch(path)
    .then((response) => {
      return response.text().toString().split('\n')
    })
    .catch(console.log)
  return result
}


var gcd = function (n, m) {
  var r = 0;
  while (n !== 0) {
    r = m % n;
    m = n;
    n = r;
  }
  return m;
};

let modInverse = (a, b) => {
  a = a % b
  for(let i = 1; i < b; i++) {
    if ((a * i) % b === 1) {
      return i
    }
  }
  return 1
}
let a = async () => {
  let numbers = await fetchRandomNumbers()
  return numbers
}

let getRSAKeyPair = () => {
  let primes = sieve(10000, 500)
  let randomNumbers = fetchRandomNumbers()
  let randomIndices = [Math.floor(Math.random() * primes.length), Math.floor(Math.random() * primes.length)]

  let selectedPrimes = [primes[randomIndices[0]], primes[randomIndices[1]]]
  let p = selectedPrimes[0]
  let q = selectedPrimes[1]

  let n = p * q
  let phi = (p  - 1) * (q - 1)

  let newPrimes = sieve(phi - 1, primes[-1])
  primes = primes.concat(newPrimes)

  let e = primes[Math.floor(Math.random() * primes.length)]
  let g = gcd(e, phi)
  let count = 0
  while (g !== 1) {
    e = primes[Math.floor(Math.random() * primes.length)]
    g = gcd(e, phi)
  }

  let d = modInverse(e, phi)

  return [[e, n], [d,n]]
}

let keyPair = getRSAKeyPair()
console.log(keyPair)
console.log('Public Key: ', keyPair[0][0])
console.log('Private Key: ', keyPair[1][0])
