import React from 'react';
import { Text, Title, Stack, Blockquote, Box, Anchor, Divider, Paper } from '@mantine/core';

export default function LiteraryAnalysisDisplay() {

  const sections = [
    {
      title: "Introduction & Book Choice",
      paragraphs: [
        `This book is ~102 pages, so I just did analyses more often than every 15 pages.`,
        `To be rather frank, I asked an AI to generate some nonfiction books related to science, and that it did. Initially, I had a Physics book (textbook?) and a Rust guide that I was absolutely ecstatic to have opportunity to read. Unfortunately, I doubted these texts would contain the varying language I was in desperate need of. Therefore, I opted for this lovely-looking novel, as it was rated quite well. Anyways, it says it’s written for parents and children (I believe for parents to communicate to their children, as it’s rather above the typical reading level of a child). Thus, being 18, between childhood and parenthood, I have both in me and am the perfect audience (or maybe I have neither and am the worst case scenario audience, but let’s not consider that).`
      ]
    },
    {
      title: "Carson, p. 15",
      content: (
        <>
          <Blockquote>
            {`“Out there, just at the edge of where-we-couldn’t-see, big waves were thundering in, dimly seen white shapes that boomed and shouted and threw great handfuls of froth at us. Together we laughed for pure joy–he had a baby meeting for the first time the wild tumult of Oceanus, I with the salt of half a lifetime of sea love in me” (Carson 15).`}
          </Blockquote>
          <Text>
            {`I don’t have much text I’ve read from the book that I can compare this to, so I honestly have no idea if this portion of text varies wildly or sticks out. Regardless, I was immediately drawn to the imagery present. “Where-we-couldn’t-see” somewhat sets the tone for me, and I’m not quite sure why. Something about the usage of hyphens reminds me of speaking to a child, and how there’s a tendency by parents to give everything a name that’s intuitive, rather than the actual name (e.g., “the nice man” or “the fun place”). A tumult she names it, and a tumult it is described. Just as easily, she may have described this scene as a fear-invoking display of nature’s raw power. And yet, the language, and the presence of the baby, make the book instantly inviting.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 22",
      content: (
        <>
          <Blockquote>
            {`“Underfoot, there is the multi-patterned northern ground cover of blueberry, checkerberry, reindeer moss, and bunchberry, and on a hillside of many spruces, with shaded ferny dells and rocky outcroppings–called the WildWoods–there are lady’s-slippers and wood lilies and the slender wands of clintonia with its deep blue berries” (Carson 22)`}
          </Blockquote>
          <Text>
            {`There’s not necessarily a shortage of imagery in this book, but this specific quote sure does have a fair amount. It describes a beautiful landscape, listing several plants surrounding the author. There’s almost an overflow of information, providing a vivid scene. Clarifications such as “called the WildWoods” create a less formal reading environment, and familiarize the reader with the surroundings, creating a personal connection.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 27",
      content: (
        <>
          <Blockquote>
            {`“When he was only a year and a half old, they became known to him as winnkies (periwinkles), weks(whelks), and mukkies (mussels) without my knowing quite how this came about, for I had not tried to teach him.” (Carson 27)`}
          </Blockquote>
          <Text>
            {`This confirmed my suspicions that children had stupid names for things. Unfortunately, I wouldn’t dare call a child stupid, so they are instead whimsical names. Anyways, it’s rather cutesy how she writes this bit, with all the little whimsical names. Surely the audience of parents, children, and I are invited in by all the overwhelming cutsy-ness. What a clever child he is, learning all of these big words. The reader can’t help but be astonished. I do appreciate her letting him run free rein.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 44",
      content: (
        <>
          <Blockquote>
            {`“If I had to influence with the good fairy who is supposed to preside over the christening of all children, I should ask that her gift to each child in the world be a sense of wonder so indestructible that it would last throughout life, as an unfailing antidote against the boredom and disenchantments of later years, the sterile preoccupation with things that are artificial, the alienation from the sources of our strength.” (Carson 44)`}
          </Blockquote>
          <Text>
            {`This portion of text is quite wonderful, and written in such a way that you can’t help but be taken aback by this saint of a woman. Anyways, I quite agree with her point. Wonder is interest, and it’s a powerful motivator. I think perhaps the sterile preoccupation with things that are artificial isn’t so bad, as nature is not the only place wherein beauty exists. That being said, I do quite agree that constant wonder would be wonderful.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 49 (1)",
      content: (
        <>
          <Blockquote>
            {`“I sincerely believe that for the child, and for the parent seeking to guide him, it is not half so important to know as to feel. If facts are the seeds that later produce knowledge and wisdom, then the emotions and the impressions of the senses are the fertile soil in which the seeds must grow.” (Carson 49)`}
          </Blockquote>
          <Text>
            {`There’s some heavy figurative language here, and it very much fits the nature theme of the book. She relates the nature to the child, which is a perfect blend for her readers, considering that the book is about science and written toward parents. It’s also quite true that children must know how to feel, as emotional intelligence is as powerful as conventional intelligence.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 49 (2)",
      content: (
        <>
          <Blockquote>
            {`“It is more important to pave the way for the chid to want to know than to put him on a diet of facts he is not ready to assimilate” (Carson 49)`}
          </Blockquote>
          <Text>
            {`I do so enjoy quotes like this, and they do qualify the book for its excellent rating. She uses the term “diet” as something generally that people don’t like, and adds a slight negative feel to it. Beyond that, the meaning holds true. Creating interest is far more powerful than providing information.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 59 (1)",
      content: (
        <>
          <Blockquote>
            {`“Exploring nature with your child is largely a matter of becoming receptive to what lies around you. It is learning again to use your eyes, ears, nostrils, and finger tips, opening up the disused channels of sensory impression” (Carson 59)`}
          </Blockquote>
          <Text>
            {`I like how she notes that “eyes, ears, nostrils, and finger tips” are underutilized. It seems odd to say at first glance, but it does encourage the reader to look deeper in themselves. It also notes that, contrary perhaps to what the reader may believe, the task is just as much for the parent as for the child.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 59 (2)",
      content: (
        <>
          <Blockquote>
            {`“For most of us, knowledge of our world comes largely through sight, yet we look about with such unseeing eyes that we are partially blind. One way to open your eyes to unnoticed beauty is to ask yourself, ‘What if I had never seen this before? What if I knew I would never see it again?’” (Carson 59)`}
          </Blockquote>
          <Text>
            {`She contributes again to the same figurative language, this time focusing on eyes, and explaining it more clearly. Further, she provides a solution to them, encouraging opening and looking internally to find the external beauty in life. It fits well with the theme of the book, in which the author encourages and teachers the reader how to find beauty in the world.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 60",
      content: (
        <>
          <Blockquote>
            {`“the inhabitants probably gave not a thought to the beauty overhead; and because they could see it almost any night perhaps they will never see it.” (Carson 60)`}
          </Blockquote>
          <Text>
            {`I do so love this quote, she does the thingy mabobber once more where she says a thingy mabobber, and then there’s a little play one words with a deeper thingy mabobber underneath. It does so encourage finding the beauty in things that you see every day, which is valuable advice.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 67",
      content: (
        <>
          <Blockquote>
            {`“Some of nature’s most exquisite handiwork is on a miniature scale, as anyone knows who has applied a magnifying glass to a snowflake” (Carson 67)`}
          </Blockquote>
          <Text>
            {`She continues here along the line of comparisons to contribute to the reader’s understanding. Rather than much of her writing, which revolves around general surroundings (e.g., the earlier quotes re. an overflow of information), she peers closer at a small thing, which is a lovely activity. It’s a reminder that nature, compared to human creations, is not so sculpted, and thus can be far more elaborate.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 73",
      content: (
        <>
          <Blockquote>
            {`“I hope Roger will later experience, as I do, the rush of remembered delight that comes with the first breath of that scent, drawn into one’s nostrils as one returns to the sea after a long absence” (Carson 73)`}
          </Blockquote>
          <Text>
            {`This is one of the times that she looks forward toward her boy’s future, and what hill we become, how he will change. It’s a peer into the future, although much of the book seems to revolve around enjoying the present, and living in the moment.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 75",
      content: (
        <>
          <Blockquote>
            {`“Take time to listen and talk about the voices of the earth and what they mean–the majestic voice of thunder, the winds, the sound of surf or flowing streams.” (Carson 75)`}
          </Blockquote>
          <Text>
            {`Compared to her typical writing, this is one of the few times she directly uses the imperative, as opposed to implying that the reader ought to do something. The commanding style creates emphasis on what she writes, and she follows it with an almost lulling tone, allowing the user to relax. While relaxing, she provides vivid auditory imagery, including personifying the thunder and earth.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 82",
      content: (
        <>
          <Blockquote>
            {`“...we’ll take our flashlights this fall and go out into the garde to hunt for the insects that play little fiddles in the grass and among the shrubbery and flower borders. The sound of insect orchestra swells and throbs night after night, from midsummer until autumn ends and the frosty nights make the tiny players stiff and numb…” (Carson 82)`}
          </Blockquote>
          <Text>
            {`Speaking to Roger, she gives an insight more directly into her life. This creates once again a personal bond with the reader. Further, she’s using lots of personification, and creating an entire imaginary scene, pretending the insects to be an orchestra. This makes the information more appealing to a child, and allows for visualization of a magical scene. I think it’s not such a bad strategy, although I hope the child doesn’t believe that the tiny players freeze to death.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 98",
      content: (
        <>
          <Blockquote>
            {`“Those who contemplate the beauty of the earth find reserves of strength that will endure as long as life lasts. There is symbolic as well as actual beauty in the migration of the birds, the ebb and flow of the tides, the folded bud ready for the spring. There is something infinitely healing in the repeated refrains of nature–the assurance that dawn comes after night, and spring after winter.” (Carson 98)`}
          </Blockquote>
          <Text>
            {`Compared to perhaps her typical, this is a more withdrawn tone. It’s a time that she isn’t necessarily living or narrating in the moment, rather taking a step back to look at the bigger picture. It glances at time as a whole, and the movement of all life on the planet. Finally, it reassures the reader that time flows, time continues, and life goes on. I personally find the cyclical nature to add a sense of monotony, although it could be perceived as comfort.`}
          </Text>
        </>
      )
    },
    {
      title: "Carson, p. 102",
      content: (
        <>
          <Blockquote>
            {`“The lasting pleasures of contact with the natural world are not reserved for scientists but are available to anyone who will place himself under the influence of earth, sea, and sky, and their amazing life” (Carson 102)`}
          </Blockquote>
          <Text>
            {`This is the very end of the book, so among other reasons I felt I must take a gander at it. While it’s not imperative exactly, it does hold a final word of advice, with not a commanding tone but an encouraging one. Over here, there’s the departure from the idea that this book is intended for parents, and more so noting that anyone who wishes to can see the beauty of the world.`}
          </Text>
        </>
      )
    }
  ];

  const paperStyle = {
    border: '3px solid rgb(119, 13, 168)', // Purple border
    backgroundColor: '#25262B', // Dark background for the paper
    // color: '#C1C2C5', // Light gray text color for contrast, if needed globally here
  };

  return (
    <Box style={{ display: 'flex', justifyContent: 'center', width: '100%'}} py="xl" px="md">
      <Stack gap="xl" style={{ maxWidth: '900px', width: '100%', gap: '60px' }}> {/* Explicit pixel gap on outer Stack */}
        {/* Page Title */}
        <Stack align="center" gap="xl" style={{ gap: '30px' }}> {/* Explicit pixel gap on this Stack */}
          <Title order={1} ta="center">Literary Analysis<br/><br/></Title>
        </Stack>

        {/* Dynamically generated sections */}
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            <Paper
              shadow="sm"
              p="xl" // Padding inside the paper
              radius="md" // Rounded corners
              style={paperStyle}
            >
                <Title order={2} style={{ marginBottom: '16px' /* Adds space below title */ }}>{section.title}</Title>
                {section.paragraphs ? (
                  section.paragraphs.map((paragraph, pIndex) => (
                    <Text key={pIndex} style={{ marginBottom: '12px' /* Adds space between paragraphs */ }}>{paragraph}</Text>
                  ))
                ) : (
                  // For content with Blockquote and Text, we might want to add spacing between elements if needed
                  // The <Blockquote> and <Text> components can have their own style props for margins
                  React.cloneElement(section.content, {
                    children: React.Children.map(section.content.props.children, child => 
                      React.cloneElement(child, {style: {...child.props.style, marginBottom: '12px'}})
                    )
                  })
                )}
            </Paper>
            {index < sections.length - 1 && <Divider my={48} />} {/* Divider with 48px margin top and bottom */}
          </React.Fragment>
        ))}
      </Stack>
    </Box>
  );
}