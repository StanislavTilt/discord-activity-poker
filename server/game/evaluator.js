import { rankValue } from './deck.js';

const HAND_RANKS = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1
};

const HAND_NAMES = {
  10: 'Royal Flush',
  9: 'Straight Flush',
  8: 'Four of a Kind',
  7: 'Full House',
  6: 'Flush',
  5: 'Straight',
  4: 'Three of a Kind',
  3: 'Two Pair',
  2: 'One Pair',
  1: 'High Card'
};

export function evaluateHand(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  const combos = getCombinations(allCards, 5);

  let bestHand = null;
  let bestScore = null;

  for (const combo of combos) {
    const score = scoreHand(combo);
    if (!bestScore || compareScores(score, bestScore) > 0) {
      bestScore = score;
      bestHand = combo;
    }
  }

  return {
    cards: bestHand,
    rank: bestScore.rank,
    rankName: HAND_NAMES[bestScore.rank],
    kickers: bestScore.kickers,
    score: bestScore
  };
}

function scoreHand(cards) {
  const sorted = [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
  const values = sorted.map(c => rankValue(c.rank));
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(values);
  const groups = getGroups(values);

  if (isFlush && isStraight) {
    const highCard = isStraight;
    if (highCard === 14) return { rank: HAND_RANKS.ROYAL_FLUSH, kickers: [14] };
    return { rank: HAND_RANKS.STRAIGHT_FLUSH, kickers: [highCard] };
  }

  if (groups[0].count === 4) {
    return { rank: HAND_RANKS.FOUR_OF_A_KIND, kickers: [groups[0].value, groups[1].value] };
  }

  if (groups[0].count === 3 && groups[1].count === 2) {
    return { rank: HAND_RANKS.FULL_HOUSE, kickers: [groups[0].value, groups[1].value] };
  }

  if (isFlush) {
    return { rank: HAND_RANKS.FLUSH, kickers: values };
  }

  if (isStraight) {
    return { rank: HAND_RANKS.STRAIGHT, kickers: [isStraight] };
  }

  if (groups[0].count === 3) {
    return { rank: HAND_RANKS.THREE_OF_A_KIND, kickers: [groups[0].value, ...groups.slice(1).map(g => g.value)] };
  }

  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = [groups[0].value, groups[1].value].sort((a, b) => b - a);
    return { rank: HAND_RANKS.TWO_PAIR, kickers: [...pairs, groups[2].value] };
  }

  if (groups[0].count === 2) {
    return { rank: HAND_RANKS.ONE_PAIR, kickers: [groups[0].value, ...groups.slice(1).map(g => g.value)] };
  }

  return { rank: HAND_RANKS.HIGH_CARD, kickers: values };
}

function checkStraight(values) {
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.length < 5) return false;

  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4) {
      return unique[i];
    }
  }

  // Ace-low straight (A-2-3-4-5)
  if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) {
    return 5;
  }

  return false;
}

function getGroups(values) {
  const counts = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value: parseInt(value), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
}

function getCombinations(arr, size) {
  const result = [];
  function combine(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return result;
}

export function compareScores(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
  }
  return 0;
}

export function compareHands(handA, handB) {
  return compareScores(handA.score, handB.score);
}

export { HAND_RANKS, HAND_NAMES };
