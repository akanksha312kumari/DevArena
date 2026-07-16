const mockProblems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    platform: "leetcode",
    url: "https://leetcode.com/problems/two-sum/",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    functionSignature: "function twoSum(nums, target) {\n  // your code here\n}",
    sampleTests: [
      { input: "[ [2,7,11,15], 9 ]", expected: "[0,1]" },
      { input: "[ [3,2,4], 6 ]", expected: "[1,2]" }
    ],
    hiddenTests: [
      { input: "[ [3,3], 6 ]", expected: "[0,1]" },
      { input: "[ [-1,-2,-3,-4,-5], -8 ]", expected: "[2,4]" }
    ]
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    platform: "leetcode",
    url: "https://leetcode.com/problems/reverse-string/",
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character."
    ],
    functionSignature: "function reverseString(s) {\n  // your code here\n}",
    sampleTests: [
      { input: "[ ['h','e','l','l','o'] ]", expected: "['o','l','l','e','h']" }
    ],
    hiddenTests: [
      { input: "[ ['a'] ]", expected: "['a']" },
      { input: "[ ['a','b'] ]", expected: "['b','a']" }
    ]
  }
];

module.exports = mockProblems;
