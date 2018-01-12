// This code is from https://github.com/regality/node-sieve/blob/master/sieve.js
// It is modified to use an Array for the final datastructure, instead of a typed array, so that we can use the
// concat method within the RSA generation algorithm.
let sieve = (max, min) => {
  const PRIME = 0
  const NON_PRIME = 1
  const UNKNOWN = 2
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

// Use the random.org api to get two random fractions from (0, 1)
let fetchRandomNumbers = () => {
  const path = 'https://www.random.org/decimal-fractions/?num=2&dec=10&col=1&format=html&rnd=new'
  return fetch(path).then((response) => {
    return response.text().toString().split('\n')
  })
}

// Calculate the gcd of two numbers. Used for gettingt the public key.
var gcd = function (a, m) {
  var r = 0;
  while (a !== 0) {
    r = m % a;
    m = a;
    a = r;
  }
  return m;
};

// Get the multiplicative inverse of two numbers. Used for calculating the private key.
let modInverse = (a, b) => {
  a = a % b
  for(let i = 1; i < b; i++) {
    if ((a * i) % b === 1) {
      return i
    }
  }
  return 1
}

/**
  Creates an RSA key pair using the random.org api to help select the starting prime numbers.

  We use the random.org api to get fractions to select a random prime from a list of primes because we need a list of
  of primes to help generate our public key, not just our values for p and q. We could use the random.org api to
  get a list of integers, and then check the primality of those random numbers, but that leads to the off chance that
  the list will not contain primes, and we'd have to keep getting a list of primes.

  The steps of the algorithm are:
    - Get a list of primes within a range. We need to eventually get a relatively large p and q. Ideally, we'd want
      something that is 1024 digits. But for our purposes, we'll use much smaller primes.
    - Create the modulus by multiplying p and q.
    - Calculate the totient
    - Get a prime number from the interval [3, phi) that has a gcd of 1 with the totient
    - Get the inverse of mod phi
*/
let getRSAKeyPair = () => {
  // generate all prime numbers within range
  let primes = sieve(10000, 500)
  // get declimal fractions from our api so that we can randomly select a prime number
  let randomNumbers = fetchRandomNumbers()
  // use the random decimal fractions to get an index that will be within the range of primes
  let randomIndices = [Math.floor(randomNumbers[0] * primes.length), Math.floor(randomNumbers[1] * primes.length)]

  // If you don't want to use the API, comment the above line and uncomment the below line. Also uncomment linen 101.
  // let randomIndices = [Math.floor(Math.random() * primes.length), Math.floor(Math.random() * primes.length)]

  // use the random indices to select primes fmor our list of primes
  let selectedPrimes = [primes[randomIndices[0]], primes[randomIndices[1]]]
  let p = selectedPrimes[0]
  let q = selectedPrimes[1]

  // get the modulus
  let n = p * q
  // get the totient
  let phi = (p  - 1) * (q - 1)

  // we need to choose a prime number from [3, phi) (half-open interval), so we generate the primes from the end of our
  // previous prime list
  let newPrimes = sieve(phi, primes[-1])
  // create a larger set of primes to select from for our public key
  primes = primes.concat(newPrimes)

  // We need to select e that has a gcd with phi that is equal to one-- since e is prime, there's a high probability
  // that's true, but if it's not, we need to select a new prime that does satisfy that condition
  let e = primes[Math.floor(Math.random() * primes.length)]
  let g = gcd(e, phi)
  // in the off chance that g does not have a gcd with phi equal to 1, search for a prime that does
  while (g !== 1) {
    e = primes[Math.floor(Math.random() * primes.length)]
    g = gcd(e, phi)
  }

  // because the public key has a gcd of 1 with phi, the multiplicative inverse of the public key with respect to
  // phi can be efficiently and quickly determined using the Extended Euclidean Algorithm
  // ie: e * d = 1 mod phi
  let d = modInverse(e, phi)

  // the pub and private keys are expressed as pairs with the modulus
  return [[e, n], [d,n]]
}

let keyPair = getRSAKeyPair()
console.log(keyPair)
console.log('Public Key: ', keyPair[0][0])
console.log('Private Key: ', keyPair[1][0])
