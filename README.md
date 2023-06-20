# KJV Library

The KJV library contains useful functionality to retrieve data from the KJV
of the bible. Currently, it can parse search functions without need of a
database as the KJV never needs updating so we can just grab what we want from
static files and skip any network hops and work offline. That said, the
library download will be quite a bit bigger. If you wish to use an online
service that uses a database I've provided an API written in Rust with AXUM
that you can find here: https://github.com/robcross1977/bible-api-rust

Please note: the api works differently and expects a web interface so it will
not allow you to do anything larger than a chapter query.

## Search

All you need to do to use search is install the library with npm, import the
`search` function into your code and pass it a bible query in string form. The
search function takes a single string (the query).

Basic Usage:# KJV Library
The KJV library contains useful functionality to retrieve data from the KJV
of the bible. Currently, it can parse search functions without need of a
database as the KJV never needs updating so we can just grab what we want from
static files and skip any network hops and work offline. That said, the
library download will be quite a bit bigger. If you wish to use an online
service that uses a database I've provided an API written in Rust with AXUM
that you can find here: https://github.com/robcross1977/bible-api-rust

Please note: the api works differently and expects a web interface so it will
not allow you to do anything larger than a chapter query.

`search('1 John 4:6')`

## Search Formats

Queries are not case-sensitive so you can use capitalization as you wish. There
are several different styles of queries that should work:

### Book

A book query will return all of the chapters and verses in a book. Ex: `3 John`
will return the entire book of 3 John.

### Chapter

A chapter query will return a single chapter of a book. Ex: `song of solomon 3`
will return chapter 3 of the book "Song of Solomon".

### Verse

A verse query will return a single verse. Ex: `revelation 2:3` will return verse
3 from chapter 2 of the book of Revelation.

### Chapter Range

A chapter range will return all of the chapters in the range specified. Ex:
`Mark 3-5` will return chapter 3, 4 and 5 from the book of Mark.

### Verse Range

A verse range will return a range of verses from a specified chapter. Ex:
`1 John 3:4-7` will return verse 4, 5, 6 and 7 from chapter 3 of 1 John.

### Multi-Chapter-Verse

A multi-chapter verse is a verse range that doesn't grab all of the verses from
the final chapter in the range. Ex: `TIMOTHY 2-4:5` will grab chapter 2 and 3
in their entirety from the book of Timothy, but will only grab verses 1, 2, 3,
4 and 5 from chapter 4.

### Full-Range

A full-range search can start anywhere in the first specified chapter and end
at any verse in the last specified chapter, grabbing the entire chapters in the
middle. Ex. `Judges 1:34-4:5` will grab verses 34, 35 and 36 from chapter 1
(there are 36 verses in chapter 1), then it will grab chapters 2 and 3 in their
entirety, and finally it will grab verses 1, 2, 3, 4 and 5 from chapter 4.

## Book Shortcuts

Note: You do not have to type out the entire name of the book in a query. You
must type only as many characters as needed to distinguish the book you are
looking for from other books.

Example:
Ezra and Ezekiel both exist, so the search WILL NOT work until you have at least
3 characters in the query because it will not be able to tell the difference.
However, the query `eze 1` would search for ezekiel chapter 1.

## Book Numbers

Since we can't be sure how users will enter in the preceding numbers in book
names (e.g. 1 Corinthians, 3 John, 1 Thessalonians), I have chosen to make
several options available, which are also case sensitive where applicable.
Please note, if you use roman numerals, which are letters, there MUST BE A SPACE
between the numeral and the book name. Ex. `i corinthians` will work but
`icorinthians` will NOT. This limitation is in place to make the code simpler.

### Ones

Any of the following will work for a precending "1" in the book name:

1. 1
2. 1st
3. i (with a following space)
4. one
5. fst
6. fir
7. firs
8. first

### Twos

Any of the following will work for a preceding "2" in the book name:

1. 2
2. 2nd
3. ii (with a following space)
4. two
5. sec
6. seco
7. secon
8. second

### Threes

Any of the following will work for a preceding "3" in the book name:

1. 3
2. 3rd
3. iii (with a following space)
4. th
5. thr
6. thre
7. three
8. thi
9. thir
10. third

## Sub Searches

You can specify any number of sub-searches after your main search by seperating
them with commas. Please note, you are limited to searching within a single book
in a single search so you CANNOT specify a new book. Also note, each subsequent
sub-search is based on the one before it if it isn't clear what is meant. For
instance, a single digit could be to search for a chapter or a verse, so if a
verse was specified previously it is a verse, otherwise it is a chapter. Some
subsearches do not require context because they include the chapter and verse(s)
being requested in full. The following types of sub-searches are supported:

### Chapter Sub-Search

A chapter sub-search is a single digit. Since this could also be a verse search
the context of the previous search is important. It will be considered a chapter
search ONLY if the previous search was a book, chapter or chapter-range search.

Ex. `Job 1, 3` will return chapter 1 and 3 from the book of Job.
Ex. `Job 1-3, 5` will return chapters 1, 2, 3 and 5 from the book of Job.

NOTE: `Job 1:3, 5` will be construed as a VERSE because the previous search was
a verse search.

### Chapter Range Sub-Search

A chapter-range sub search is two digits seperated with a dash ex. `3-5`. Since
this could also be a verse range, the context of the previous search is
important. It will ONLY be considered a chapter-range search if the previous
search was a book, chapter or chapter range.

Ex. `Job 1, 3-5` will return chapter 1, 3, 4 and 5 from the book of Job.
NOTE: `Job 1:3, 5-8` will NOT return chapters 5-8, it will return VERSES because
the previous search included a verse.

### Chapter Verse

A chapter-verse sub search is a special type of search. You can specify a verse
if the preceding search was also a verse, but with a chapter-verse sub-search it
doesn't matter what the previous search was, a chapter and a verse are still
specified so the previous context is unimportant.

Ex. `Job 1, 3:4` is chapter 1 of the book of job, and chapter 3 verse 4.
Ex. `Job 1:2, 3:4` is chapter 1 verse 2, and chapter 3 verse 4 of the book of
Job.

### Verse

A verse search is a single digit. Since a single digit could be a chapter or a
verse the preceding context is important. The single digit will be considered a
chapter if the preceding search was a book, chapter or chapter-range, but a
verse otherwise (as a verse was specified in all of the other types of searches)

Ex. `Job 1:2, 5` will return chapter 1 verse 2 and 5 from the book of Job.

### Verse Range

A verse-range search is two digits with a dash between them. Since this pattern
can also be a chapter-range the preceding context is important. The digits will
be considered a verse-range if the preceding search included a verse, so book,
chapter or chapter-range searches will be a chapter range, but any other
previous search type will net a verse-range as a verse is specified in those.

Ex. `Job 1:2, 4-6` will return verse 2, 4, 5 and 6 from chapter 1 of the book of
Job.

### Full-Verse Range

This is another special type of sub-search that will be considered a verse-range
no matter the context of the previous search, as you will supply the verse.

Ex. `Job 1, 3:4-6` will return the entirety of chapter 1, then verse 4, 5 and 6
of chapter 3 in the book of Job.

### Multi-Chapter Verse

As the verse is specified in this type of sub-search, the preceding search will
not be of consequence.

Ex. `Job 1, 4-6:6` will return chapter 1, 4 and 5 in their entirety, and then
verses 1, 2, 3, 4, 5 and 6 from chapter 6 of the book of Job.

### Full-Range

As the verse is specified in this type of sub-search, the preceding search will
not be of consequence.

Ex. `Job 1, 4:19-6:3` will grab chapter 1 from the book of Job in its entirety,
and then verses 19, 20 and 21 from chapter 4, all of chapter 5 and then verses
1, 2 and 3 of chapter 6.

### Result Format

The results will be stored in the Book type:

```typescript
type VerseRecords = Record<number, string>;
type ChapterRecords = Record<number, VerseRecords>;
type Book = Record<string, ChapterRecords>;
```

Example:

```typescript
const Obadiah: Book = {
  obadiah: {
    1: {
      1: "The vision of Obadiah. Thus saith the Lord GOD concerning Edom; We have heard a rumour from the LORD, and an ambassador is sent among the heathen, Arise ye, and let us rise up against her in battle.",

      2: "Behold, I have made thee small among the heathen: thou art greatly despised.",

      3: "The pride of thine heart hath deceived thee, thou that dwellest in the clefts of the rock, whose habitation is high; that saith in his heart, Who shall bring me down to the ground?",

      4: "Though thou exalt thyself as the eagle, and though thou set thy nest among the stars, thence will I bring thee down, saith the LORD.",

      5: "If thieves came to thee, if robbers by night, (how art thou cut off!) would they not have stolen till they had enough? if the grapegatherers came to thee, would they not leave some grapes?",

      6: "How are the things of Esau searched out! how are his hidden things sought up!",

      7: "All the men of thy confederacy have brought thee even to the border: the men that were at peace with thee have deceived thee, and prevailed against thee; they that eat thy bread have laid a wound under thee: there is none understanding in him.",

      8: "Shall I not in that day, saith the LORD, even destroy the wise men out of Edom, and understanding out of the mount of Esau?",

      9: "And thy mighty men, O Teman, shall be dismayed, to the end that every one of the mount of Esau may be cut off by slaughter.",

      10: "For thy violence against thy brother Jacob shame shall cover thee, and thou shalt be cut off for ever.",

      11: "In the day that thou stoodest on the other side, in the day that the strangers carried away captive his forces, and foreigners entered into his gates, and cast lots upon Jerusalem, even thou wast as one of them.",

      12: "But thou shouldest not have looked on the day of thy brother in the day that he became a stranger; neither shouldest thou have rejoiced over the children of Judah in the day of their destruction; neither shouldest thou have spoken proudly in the day of distress.",

      13: "Thou shouldest not have entered into the gate of my people in the day of their calamity; yea, thou shouldest not have looked on their affliction in the day of their calamity, nor have laid hands on their substance in the day of their calamity;",

      14: "Neither shouldest thou have stood in the crossway, to cut off those of his that did escape; neither shouldest thou have delivered up those of his that did remain in the day of distress.",

      15: "For the day of the LORD is near upon all the heathen: as thou hast done, it shall be done unto thee: thy reward shall return upon thine own head.",

      16: "For as ye have drunk upon my holy mountain, so shall all the heathen drink continually, yea, they shall drink, and they shall swallow down, and they shall be as though they had not been.",

      17: "But upon mount Zion shall be deliverance, and there shall be holiness; and the house of Jacob shall possess their possessions.",

      18: "And the house of Jacob shall be a fire, and the house of Joseph a flame, and the house of Esau for stubble, and they shall kindle in them, and devour them; and there shall not be any remaining of the house of Esau; for the LORD hath spoken it.",

      19: "And they of the south shall possess the mount of Esau; and they of the plain the Philistines: and they shall possess the fields of Ephraim, and the fields of Samaria: and Benjamin shall possess Gilead.",

      20: "And the captivity of this host of the children of Israel shall possess that of the Canaanites, even unto Zarephath; and the captivity of Jerusalem, which is in Sepharad, shall possess the cities of the south.",

      21: "And saviours shall come up on mount Zion to judge the mount of Esau; and the kingdom shall be the LORD\u2019s.",
    },
  },
};
```

### Misspellings

I am interested in making the library as friendly as possible, so if you come
across any common mispellings that you believe I should support, let me know at
`robertcrossland@proton.me`.

### Coming Soon

I plan on adding text search abilities based on the context of the search,
though I'm not sure I can do it in json form like I have it now, though I will
give it a shot.

Also, commentaries and concordance coming soon.
