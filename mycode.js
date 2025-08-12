const text = `"And hawksbill sea turtles? Under ultraviolet light, they turn into glow-in-the-dark, underwater Christmas decorations, with both greens and reds arranged in overlapping chevrons."
By comparing the animals to Christmas lights, it paints a vivid picture of what the animals look like under UV light, and how colorful they become, and hints at how sea turtles see each other – which would be very different from what we normally think of how turtles look like. It's unfortunate that the article doesn't actually show a picture of a sea turtle under UV light, so it's a bit harder for the reader to truly appreciate the comparison. But, they do have some pictures of a comparison of opossums under UV light and under regular light. I think it weakens the article a bit, but also space is a premium, and maybe pictures of turtles under UV light just aren't available.

"And this is what makes the new snake study so interesting."
The article transitions between ideas using short sentences. Before, the article was building up one theory on why animals glow under UV light: it's useful for reproduction, for example it can "guide pollinators to their flowers". However, this sentence serves as a meaningful segue to a new study about snakes under UV light: they don't use it for reproduction, but rather it serves a camouflage purpose. The sentence builds up expectation for this new idea, and hints that the snake study is so interesting because it will be different from the theory that readers have just read.

"Likewise, prairie rattlesnakes may have evolved to get rid of their UV colorations on a landscape where reflecting UV would make them stand out like a neon sign in a diner window"
This apt simile adds to the meaning of the article. Scientists have been wondering why so many animals glow under UV light, and one theory is that predators can see UV light, so in dense jungles and forests where plants themselves reflect UV light, snakes emit UV light as a sort of camouflage. However, out in the open, in the prairie, this wouldn't be a useful feature, and so the comparison to a neon sign at a diner window brings to attention how easy prey prairie snakes would be if they glowed under UV light.

'“It’s really easy to get hung up on this being like some amazing, super-secret,” says Crowell. “When in reality, we just have to treat it like any other color. Like, there are scenarios where green will help you hide, and scenarios where green is terrible to have, because you'll stand out.”'
This is an important takeaway from the whole article. UV light is just like any other light, and just because it is so rare and unique for us humans to see, it doesn't mean that it's so unique for animals. For example, blue is a really rare color in nature because it wasn't until recently that life has even evolved to be able to see the color! So, the article reminds readers that what may seem strange to humans doesn't necessarily mean it is strange for animals, and we have to adopt an open mind, and find analogies to understand new things – in this case, thinking of UV light as just another color.

'“We can go underwater and revisit some of these animals that were described for the first time hundreds of years ago,” says Gruber. “We can see them in a new light and find things that are meaningful to them and to their world that we just hadn’t known before, because we didn’t have the tools to examine them.”'
By ending with a quote by a scientist, it ties back the whole article and is a great way to remind readers the purpose of investigating these bioluminescent creatures. It reminds readers that animals are so much more complex than we first thought, and UV light is only one aspect of this: as humans, we can't see UV light, so scientists never really considered investigating whether other animals can glow under UV light. But, as more research and more tools are made available, we learn more about how animals see, and how they see differently from us – how they actually can see UV light, and how that shapes the way they evolve and behave in the wild.

"In the early hours of September 28, 2023, an act of violence and vandalism shocked the U.K. The next day, news of the attack dominated social media and mainstream news coverage, leading to outpourings of grief, fury at its senselessness, and pilgrimages to the remote stretch of countryside where the crime took place."
The introduction of this article is very powerful. The author sets us up, and we assume that the act of violence would be against humans, and maybe a few deaths or injuries. And, it continues by detailing the outrage that took place. From here, readers could assume it could have been a hate crime, or the death of some high-profile celebrity. However, the author turns all that on to its head when it's revealed that, in fact, the crime was that a tree was illegally cut down.

'“Trees have always been important across cultures,” says Provan. “If this had happened in Japan, this would have been immensely important; in Shinto, it would have destroyed the home of a God. In the West, we bring in Christmas trees to celebrate the end of the year. Trees are highly significant figures in any landscape.”'
This is a really interesting perspective on trees that I haven't thought about before. Trees are indeed very deeply rooted in our culture. However, they are also very invisible, and personally, I've never really realized how much trees are rooted in our society. They are quintessential parts of any outdoor environment, and trees also delineate the border between cities and nature. So, it really does make sense why there would be so much outrage about the sycamore tree being cut down: it has been etched into the British ethos, and people have built memories and culture around that tree. So, when it was cut down, it felt like an attack on their culture and their memories.

"Yet trees can be reborn, and the act could lead to a greater legacy than the tree could have managed alone. Shortly after its destruction, the Sycamore Gap tree began to grow saplings around its stump"
The article ends on a hopeful note, and gives optimism for the future. For all the bad things humanity can do, humanity can also repent. When we realized that cutting down forests was bad for the environment, and when we realized our carbon emissions were causing climate change, we changed and took steps towards becoming more sustainable. So, one of the messages of the article is to remind readers that humans are two-sided. For all the evil we may have caused (cutting down the sycamore tree), it doesn't mean that we are all bad, and the outrage and the court trial against the people who cut down the tree is proof that there is still good in this world.

China has come to the table - but this fight with the US is far from over (5)
"But officials have become increasingly concerned about the impact the tariffs could have on an economy that is already struggling to deal with a property crisis, stubbornly high youth unemployment and low consumer confidence."
The target audience of this article must know a little about China's economy in recent years to truly understand what China is thinking and how they are reacting to the trade war. China's growth has been slowing, and it is also dealing with a property crisis as the value of property is going down while most people have put their savings into property. So, in this context, China's reciprocal trade tariffs and rhetoric is a risky play for its economy, but also would help cement its position as a responsible trading partner.

"But Trump's characterisation of a "total reset" in relations may be overly optimistic as there is a slight sting in the tail in Beijing's statement. The Commerce Ministry ended with a reminder of who it sees as being in the wrong."
This is a noticeable shift in the article. Before, the article outlined the events that have since happened have been relatively positive. Neither China nor the US want to decouple, and both have since started negotiations, and lowered their reciprocal tariffs. However, this sentence marks a shift in the positive rhetoric. Things are not all perfect, and the tariffs are only going to last 90 days. This isn't the end of the trade war, and readers should not be too optimistic for any resolutions.
`;

const lines = text.trim().split(/\n{2,}/);

const bubs = lines.map((k, i) => {
    const [quote, text] = k.split("\n");
    // const pageNumber = +/\((\d+)\)/g.exec(quote)[1];

    return `---
title: 
order: ${i}
---

> ${quote}

${text}`;
});

const fs = require("fs");
for (let i = 0; i < bubs.length; i++) {
    fs.writeFileSync(`output_folder/blog-page-${i + 1}.md`, bubs[i]);
}