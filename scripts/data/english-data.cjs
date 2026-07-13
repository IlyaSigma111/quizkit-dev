const q = (text, answers, correctIdx, grades) => ({ q: text, a: answers, c: correctIdx, g: grades || null })

const ENG5 = [
  q('Apple — это:', ['Яблоко', 'Апельсин', 'Груша', 'Персик'], 0, [5,6]),
  q('Dog — это:', ['Собака', 'Кошка', 'Птица', 'Рыба'], 0, [5,6]),
  q('Как сказать «привет»?', ['Hello', 'Goodbye', 'Thank you', 'Sorry'], 0, [5,6]),
  q('What colour is the sky?', ['Blue', 'Red', 'Green', 'Yellow'], 0, [5,6]),
  q('Сколько букв в английском алфавите?', ['26', '24', '28', '30'], 0, [5,6]),
  q('Как образуется множественное число?', ['+s', '+es', '+ing', '+ed'], 0, [5,6]),
  q('I ___ a student', ['am', 'is', 'are', 'be'], 0, [5,6]),
  q('He ___ a teacher', ['is', 'am', 'are', 'be'], 0, [5,6]),
  q('Cat — множественное число:', ['Cats', 'Cates', 'Caties', 'Cat'], 0, [5,6]),
  q('Big — сравнительная степень:', ['Bigger', 'Biggest', 'More big', 'Biger'], 0, [5,6]),
  q('What is your name? — ответ:', ['My name is...', 'I am fine', 'I am 10', 'Hello'], 0, [5,6]),
  q('Время: Present Simple — маркер:', ['Usually', 'Now', 'Yesterday', 'Tomorrow'], 0, [5,6]),
  q('Как перевести «green»?', ['Зелёный', 'Красный', 'Синий', 'Жёлтый'], 0, [5,6]),
  q('I like ___ (играть в футбол)', ['playing', 'play', 'to playing', 'played'], 0, [5,6]),
  q('She ___ to school every day', ['goes', 'go', 'going', 'went'], 0, [5,6]),
  q('Артикль a/an: an используется перед:', ['Гласным звуком', 'Согласным', 'Любым', 'Не используется'], 0, [5,6]),
]

const ENG6 = [
  q('Bench — это:', ['Скамейка', 'Дверь', 'Окно', 'Стена'], 0, [6,7]),
  q('Butterfly — это:', ['Бабочка', 'Стрекоза', 'Жук', 'Пчела'], 0, [6,7]),
  q('Rainbow — это:', ['Радуга', 'Молния', 'Гроза', 'Снегопад'], 0, [6,7]),
  q('Глагол to be в Past Simple:', ['Was/were', 'Is/are', 'Am/is/are', 'Be'], 0, [6,7]),
  q('Present Continuous:', ['Am/is/are + Ving', 'V/Vs', 'Will + V', 'Have + V3'], 0, [6,7]),
  q('Времена: now — маркер:', ['Present Continuous', 'Present Simple', 'Past Simple', 'Future'], 0, [6,7]),
  q('Future Simple:', ['Will + V', 'Am + Ving', 'Have + V3', 'Ved'], 0, [6,7]),
  q('Неправильный глагол: go — went — ?', ['Gone', 'Went', 'Going', 'Goed'], 0, [6,7]),
  q('Притяжательный падеж: книга мальчика:', ['Boy\'s book', 'Boy book', 'Boys book', 'Book of boy'], 0, [6,7]),
  q('There is/are: на столе книга:', ['There is a book', 'There are a book', 'A book there is', 'Is a book'], 0, [6,7]),
  q('Предлоги места: in, on, under — под:', ['Under', 'On', 'In', 'Behind'], 0, [6,7]),
  q('Степени сравнения: good — better — ?', ['Best', 'Goodest', 'More good', 'The best'], 0, [6,7]),
  q('How many — с чем?', ['С исчисляемыми', 'С неисчисляемыми', 'С любыми', 'С глаголами'], 0, [6,7]),
  q('I can ___ (плавать)', ['swim', 'to swim', 'swimming', 'swam'], 0, [6,7]),
  q('Every day — маркер:', ['Present Simple', 'Present Continuous', 'Past Simple', 'Future'], 0, [6,7]),
]

const ENG78 = [
  q('Present Perfect: have/has + ?', ['V3', 'Ving', 'V', 'Ved'], 0, [7,8]),
  q('Past Continuous:', ['Was/were + Ving', 'Ved', 'Have + V3', 'Will + V'], 0, [7,8]),
  q('Модальные глаголы: must, can, may', ['Выражают возможность', 'Действие', 'Состояние', 'Время'], 0, [7,8]),
  q('Passive Voice: is/are + ?', ['V3', 'Ving', 'V', 'Ved'], 0, [7,8,9]),
  q('Conditionals: If it ___ (rain), I will stay', ['rains', 'rained', 'will rain', 'is raining'], 0, [7,8,9]),
  q('Reported Speech: He said he ___ (be) tired', ['was', 'is', 'will be', 'has been'], 0, [7,8,9]),
  q('Relative clauses: who, which, that', ['Who — для людей', 'Which — для людей', 'That — только для вещей', 'Все для людей'], 0, [7,8]),
  q('Артикли: the с уникальными объектами:', ['The sun', 'A sun', 'Sun', 'Some sun'], 0, [7,8]),
  q('I have been waiting — это:', ['Present Perfect Continuous', 'Present Perfect', 'Present Continuous', 'Past Continuous'], 0, [7,8]),
  q('Before — используется с:', ['Past Perfect', 'Past Simple', 'Present Perfect', 'Future'], 0, [7,8]),
  q('Phrasal verb: look after — это:', ['Заботиться', 'Искать', 'Выглядеть', 'Наблюдать'], 0, [7,8]),
  q('Too и enough: too expensive — это:', ['Слишком дорого', 'Достаточно дорого', 'Недорого', 'Очень дорого'], 0, [7,8]),
  q('Wish: I wish I ___ (know) the answer', ['knew', 'know', 'will know', 'have known'], 0, [7,8,9]),
  q('Either... or:', ['Или... или', 'Ни... ни', 'Как... так и', 'Не только... но и'], 0, [7,8]),
  q('Neither... nor:', ['Ни... ни', 'Или... или', 'Как... так и', 'Не только... но и'], 0, [7,8]),
  q('Used to:', ['Раньше делал', 'Привык делать', 'Обычно делаю', 'Собираюсь сделать'], 0, [7,8]),
]

const ENG9 = [
  q('Subjunctive Mood: If I ___ (be) you...', ['were', 'was', 'am', 'will be'], 0, [9,10,11]),
  q('Complex Object: I want him ___ (go)', ['to go', 'go', 'going', 'went'], 0, [9,10,11]),
  q('Infinitive vs Gerund: enjoy + ?', ['Ving', 'to V', 'V', 'Ved'], 0, [9,10,11]),
  q('Participle clauses:', ['Причастные обороты', 'Придаточные', 'Деепричастия', 'Инфинитивы'], 0, [9,10,11]),
  q('Causative: have something done', ['Сделать что-то чужими руками', 'Сделать самому', 'Заставить сделать', 'Позволить'], 0, [9,10,11]),
  q('Inversion: Never ___ I seen such beauty', ['have', 'did', 'was', 'had'], 0, [9,10,11]),
  q('Emphatic do: I ___ know!', ['do', 'am', 'have', 'was'], 0, [9,10,11]),
  q('Quantifiers: a lot of, much, many', ['Many — с исчисляемыми', 'Much — с исчисляемыми', 'A lot — только формально', 'Все для любого'], 0, [9,10,11]),
  q('Noun modifiers:', ['Существительное как определение', 'Прилагательное', 'Глагол', 'Наречие'], 0, [9,10,11]),
  q('Linking words: however, moreover', ['Однако, более того', 'Потому что', 'Хотя', 'Если'], 0, [9,10,11]),
  q('Word formation: -tion, -ment, -ness', ['Суффиксы существительных', 'Прилагательных', 'Глаголов', 'Наречий'], 0, [9,10,11]),
  q('Prepositions: depend ___', ['on', 'of', 'from', 'in'], 0, [9,10,11]),
  q('Phrasal verb: give up — это:', ['Бросать, сдаваться', 'Давать', 'Раздавать', 'Выдавать'], 0, [9,10,11]),
  q('Collocations: make/do — make a ___', ['decision', 'homework', 'business', 'nothing'], 0, [9,10,11]),
  q('Confusing words: sensible vs sensitive', ['Sensible — разумный', 'Sensible — чувствительный', 'Sensitive — разумный', 'Одно и то же'], 0, [9,10,11]),
  q('State verbs: know, believe, love — не используются в:', ['Continuous', 'Simple', 'Perfect', 'Passive'], 0, [9,10,11]),
]

module.exports = { ENG5, ENG6, ENG78, ENG9 }
