import React from 'react';
import { Text, Title, Stack, Blockquote, Box, Anchor, Divider, Paper } from '@mantine/core';
// If you have a CSS module for custom styles, ensure it's correctly linked.
// import classes from './James.module.css'; // Assuming this is your CSS module

export default function LiteraryAnalysisDisplay() {

  const sections = [
    {
      title: "Author's Note on Personal Reactions",
      paragraphs: [
        `After reading my nonfiction book, I feel I didn’t add enough personal reactions in my notes. To make up for that, I’m doing a whole lot in these articles.`
      ]
    },
    {
      title: "Bridle on AI: Appropriation and Danger",
      content: (
        <>
          <Blockquote>
            {`“Artificial intelligence in its current form is based on the wholesale appropriation of existing culture, and the notion that it is actually intelligent could be actively dangerous” (Bridle, 0)`}
          </Blockquote>
          <Text>
            {`I know he’s said hardly anything, but I thought I’d provide my thoughts coming into this. To be clear, I don’t like AI. It near killed an activity I found a delight and possible occupation (software development), and has endless ethical concerns. That being said, I do believe it to be intelligent, to a degree. As humans, we have active sensory systems. As time moves, we collect information, perceiving the surrounding world, and synthesize it, building and modifying our intellect. AI, on the other hand, trains on data collected from all around the world, through a variety of times, synthesizes it into some sense, using prediction to form complete thoughts and sentences. It is named artificial intelligence for a reason, because it is not intelligent in the way that organic beings are. However, it could be argued that it is indeed intelligent. Intelligence is acquiring and applying knowledge and skills, and AI can not only research, it can synthesize and produce, with genuinely helpful applications. I do believe that it has intelligence, to an extent.`}
          </Text>
        </>
      )
    },
    {
      title: "Bridle on AI: Uncanny Interpretations",
      content: (
        <>
          <Blockquote>
            {`“The software allowed users to enter a simple description of an image they had in their mind and, after a brief pause, the software would produce an almost uncannily good interpretation of their suggestion” (Bridle 1)`}
          </Blockquote>
          <Text>
            {`“Uncanny” already has relatively negative connotations surrounding it. It came especially early into the text, directly after the first sentence. The usage of the word initiates the possible tone of the article, and makes the author’s opinions quite clear, already. He does seem to compliment the skills of the AI, but certainly in a backhanded manner.`}
          </Text>
        </>
      )
    },
    {
      title: "Bridle on AI: Promises and Knowledge Access",
      content: (
        <>
          <Blockquote>
            {`“They promised that in doing so they would open up new realms of human experience, give us access to all human knowledge, and create new kinds of human connection” (Bridle)`}
          </Blockquote>
          <Text>
            {`At current, it seems much of the article has failed to address and support the title. There’s been a fair amount of talking of origins, and how AI works, and moral concerns, but genuinely rather little of discussion regarding its actual intelligence. At current, there are hundreds, thousands of AI models, chatbots, systems, and codebases free on the internet. Truthfully, to an extent they do allow for broadreaching knowledge. To be fair, “access to all human knowledge” is a double-sided thing. If you want something to have access to all human knowledge, understand that it will access those things, and don’t get mad about copyright violations. If you don’t, then understand if it doesn’t know anything. It’s said that nothing is truly free, and that is relatively common knowledge. Companies like OpenAI do sell information, as do many of the largest corporations around the world. However, they also do provide top of the line models that synthesize huge quantities of data.`}
          </Text>
        </>
      )
    },
    {
      title: "Bridle on AI: The Case of Loab",
      content: (
        <>
          <Blockquote>
            {`“But when they checked to see if it went the other way, by typing in “DIGITA PNTICS skyline logo::-1”, something much stranger happened: all of the images depicted a creepy-looking woman with sunken eyes and reddened cheeks, who the artist christened Loab. Once discovered, Loab seemed unusually and disturbingly persistent. Feeding the image back into the program, combined with ever more divergent text prompts, kept bringing Loab back, in increasingly nightmarish forms, in which blood, gore and violence predominated.” (Bridle)`}
          </Blockquote>
          <Text>
            {`This passage does one solid point, although not directly. My main concern here is the prompt injection, which has since been resolved. However, it does raise the question that no organic intelligence systems would be vulnerable to “injections” in the form that software is vulnerable. On the other hand, much of this article continues to be dedicated to calling AI creepy, as opposed to discussing its intelligence.`}
          </Text>
        </>
      )
    },
    {
      title: "Bridle on AI: The Stupidity of ChatGPT",
      content: (
        <>
          <Blockquote>
            {`“Now, this didn’t happen because ChatGPT is inherently rightwing. It’s because it’s inherently stupid. It has read most of the internet, and it knows what human language is supposed to sound like, but it has no relation to reality whatsoever. It is dreaming sentences that sound about right, and listening to it talk is frankly about as interesting as listening to someone’s dreams. It is very good at producing what sounds like sense, and best of all at producing cliche and banality, which has composed the majority of its diet, but it remains incapable of relating meaningfully to the world as it actually is. Distrust anyone who pretends that this is an echo, even an approximation, of consciousness. (As this piece was going to publication, OpenAI released a new version of the system that powers ChatGPT, and said it was “less likely to make up facts”.)” (Bridle)`}
          </Blockquote>
          <Text>
            {`Around this section of the article, Bridle does begin to address the actual “stupidity.” I selected this passage as much of the surrounding is relatively similar, or at least on similar points. I do like how he more directly addresses the point of “stupidity,” which is held within the title. It is true that AI is not typically especially smart, or at least not the unpaid versions. However, he has several fallacies that make his points rather void to me. Firstly, he uses a branching generalization. ChatGPT does not encompass AI, and is not by any means a monopoly or the sole contributor to the industry. Secondly, the unpaid versions are a completely different experience, running on different algorithms, and with much less data and thought behind their answers. For instance, deep research models would actively seek out and research information. What Bridle did here was the equivalent of going to the dollar store, buying a child’s shovel for the cheapest possible price he could find, trying it out unsuccessfully, and declaring that all shovels in the world are quite horrendous. It is true that even the smartest models make mistakes, and that would have been a far more effective point to make. Furthermore, he fails to address the point in the subtitle, “the notion that it is actually intelligent could be actively dangerous” (Bridle). Just because the worst possible model wasn’t especially smart doesn’t mean that the systems behind AI don’t qualify as a form of intelligence.`}
          </Text>
        </>
      )
    },
    {
      title: "Klein & Taylor on Corporate City States",
      content: (
        <>
          <Blockquote>
            {`“The movement for corporate city states cannot believe its good luck. For years, it has been pushing the extreme notion that wealthy, tax-averse people should up and start their own high-tech fiefdoms, whether new countries on artificial islands in international waters (“seasteading”) or pro-business “freedom cities” such as Próspera, a glorified gated community combined with a wild west med spa on a Honduran island.” (Klein, Taylor)`}
          </Blockquote>
          <Text>
            {`It’s relatively clear from the beginning that the authors may not approve of this movement, personifying it. Further, it pushes the idea that the wealthy are trying to create kingdoms. If there’s one thing Americans hate, it’s those god damned monarchs (or so I used to believe). That being said, I did look into Próspera, and everything inside the advertisement appears to be a Corporate Kingpin’s dream: freedom from legal restrictions (the only things that can control them, as their morals died long ago). Further, Trump is a big fan of “freedom cities,” which assures me that there could not be an ounce of corruption contained within them. I forgot to note, the ad contained different stock clips of bitcoin and ethereum logos (not that cryptocurrencies are the leading currencies of illegal markets...`}
          </Text>
        </>
      )
    },
    {
      title: "Klein & Taylor on Silicon Valley Elites and the Rapture Analogy",
      content: (
        <>
          <Blockquote>
            {`“Interestingly, at a time when previously secular Silicon Valley elites are suddenly finding Jesus, it is noteworthy that both of these visions – the priority-pass corporate state and the mass-market bunker nation – share a great deal in common with the Christian fundamentalist interpretation of the biblical Rapture, when the faithful will supposedly be lifted up to a golden city in heaven, while the damned are left to endure an apocalyptic final battle down here on earth.” (Klein, Taylor)`}
          </Blockquote>
          <Text>
            {`The article continues on a relatively sarcastic note, as shown by the word “Interestingly.”  The word “elites‘ probably isn’t utilized with a particularly loving connotation either, despite the fact that followers of Jesus are inherently always loving people. The referenced portion of the bible also isn’t particularly friendly toward most readers, especially those who agree with the NCLB Act (who may have to modify their alignment to the No Child Except the Damned Ones Left Behind Act). All in all, not good looks for the elites.`}
          </Text>
        </>
      )
    },
    {
      title: "Klein & Taylor on Trump Administration Propaganda",
      content: (
        <>
          <Blockquote>
            {`“And so we have the Trump administration’s dedication to releasing its steady stream of real and AI-generated propaganda designed solely for these pornographic purposes. Footage of shackled immigrants being loaded on to deportation flights, set to the sounds of clanking chains and locking cuffs, which the official White House X account labeled “ASMR”, a reference to audio designed to calm the nervous system. Or the same account sharing news of the detention of Mahmoud Khalil, a US permanent resident who was active in Columbia University’s pro-Palestinian encampment, with the gloating words: “SHALOM, MAHMOUD.” Or any number of homeland security secretary Kristi Noem’s sadism-chic photo ops (atop a horse at the US-Mexican border, in front of a crowded prison cell in El Salvador, slinging a machine gun while arresting immigrants in Arizona …).” (Klein, Taylor)`}
          </Blockquote>
          <Text>
            {`This was relatively powerful, and I quite admired this little section. While alone it may not contribute directly to the main idea of the article, it still does deliver a powerful message. Specifically, the linked post was an especially egregious and horrific one. Too, it picks out all the perfect things, including the ASMR subtitle, and a brief explanation of what ASMR is. It’s perfectly constructed to make it clear to the reader that such a horrible thing should be no comfort, contrary to what the current administration may believe. Also, I hadn’t seen this before and it’s a bit funny: Kristi Noem roasted for her gun handling skills in ICE photo-op.`}
          </Text>
        </>
      )
    },
    {
      title: "Klein & Taylor on Elon Musk's Ethos",
      content: (
        <>
          <Blockquote>
            {`“Elon Musk, who dramatically grew his fortune alongside Thiel at PayPal, embodies this implosive ethos. This is a person who looks up at the wonders of the night sky and apparently sees only opportunities to fill that inky unknown with his own space junk. Though he burnished his reputation warning about the dangers of the climate crisis and AI, he and his so-called “department of government efficiency” (Doge) henchmen now spend their days escalating those same risks (and many others) by slashing not only environmental regulations but entire regulatory agencies, with the apparent end goal of replacing federal workers with chatbots.” (Klein, Taylor)`}
          </Blockquote>
          <Text>
            {`This paragraph uses some pretty heavy wording. Using “space junk” is some pretty powerful language (language that the AP Lang test writers loved this year). They heavily imply that Elon is working only for himself, and that the rocketry projects have little benefit to the rest of the world. They also refer to “henchmen” and other terms that don’t have lovely implications.`}
          </Text>
        </>
      )
    },
    {
      title: "Klein & Taylor on Resource Hoarding and End Times Fascism",
      content: (
        <>
          <Blockquote>
            {`“If policing the boundaries of the bunkered nation is end times fascism’s job one, equally important is job two: for the US government to lay claim to whatever resources its protected citizens might need to get through the tough times ahead. Maybe it’s Panama’s canal. Or Greenland’s fast-melting shipping routes. Or Ukraine’s critical minerals. Or Canada’s fresh water. We should think of this less as old-school imperialism than super-sized prepping, at the level of the national state. Gone are the old colonial fig leaves of spreading democracy or God’s word – when Trump covetously scans the globe, he is stockpiling for civilizational collapse.” (Klein, Taylor)`}
          </Blockquote>
          <Text>
            {`They send their message by referring to end fascism as an entity, one that’s painted as something malicious. Further, they pair end fascism alongside the Republican party, especially Trump (who is responsible, among others, for the policing of borders). They continue to use words like “covetously” to host poor implications.`}
          </Text>
        </>
      )
    },
    {
      title: "Klein & Taylor on the Armageddon Complex Across Class Lines",
      content: (
        <>
          <Blockquote>
            {`“As fascism always does, today’s Armageddon complex crosses class lines, bonding billionaires to the Maga base. Thanks to decades of deepening economic stresses, alongside ceaseless and skillful messaging pitting workers against one another, a great many people understandably feel unable to protect themselves from the disintegration that surrounds them (no matter how many months of ready-to-eat meals they buy). But there are emotional compensations on offer: you can cheer the end of affirmative action and DEI, glorify mass deportation, enjoy the denial of gender-affirming care to trans people, villainize educators and health workers who think they know better than you, and applaud the demise of economic and environmental regulations as a way to own the libs. End times fascism is a darkly festive fatalism – a final refuge for those who find it easier to celebrate destruction than imagine living without supremacy.” (Klein, Taylor)`}
          </Blockquote>
          <Text>
            {`“Armageddon” is not such a friendly and inviting word, nor is complex, nor is the idea of billionaires bonding together, nor is them all coming under an umbrella held by MAGA (who is supportive of those billionaires). Klein and Taylor sarcastically give thanks to economic stresses and various other poor factors, with an ironic taste on the tongue. Further, they use “own the libs,” which is often said by the far-right wing, but used ironically here.`}
          </Text>
        </>
      )
    },
    {
      title: "Anguiano on Trump's Policies and Northern California",
      content: (
        <>
          <Blockquote>
            {`“Donald Trump’s administration has sought to remake the federal government at a breakneck pace. In far northern California – where he has strong support – people have backed those efforts. But even here, the speed and scale of the president’s agenda has been cause for concern.Officials in Shasta county, a region of 180,000 perhaps best known in recent years for its turbulent far-right politics, recently voted unanimously to send a letter to the federal government expressing concern about how layoffs could affect the nearby Whiskeytown national recreation area, which brings as much as $80m to the local economy each year.” (Anguiano)`}
          </Blockquote>
          <Text>
            {`This article starts off with much less strong wording than the previous article, but there’s still some present. She uses “breakneck pace” and “cause for concern” together, essentially saying that citizens are worried about his speed, despite supporting him. It’s not extremely strongly worded, but the wording is still present. She also uses logos well, providing some background data, and making the article seem more fact-backed.`}
          </Text>
        </>
      )
    },
    {
      title: "Anguiano on the Impact on Rural Communities",
      content: (
        <>
          <Blockquote>
            {`“But the unease in an area where the president is still deeply popular highlights the potential effects the cuts pose to the region – particularly its rural communities – that is more reliant on federal support on everything from infrastructure to emergency preparedness to healthcare and childcare.\n\n‘These cuts may, in fact, hurt rural communities harder because they just don’t have their tax bases,’ said Lisa Pruitt, a rural law expert at the University of California, Davis.’“Their bandwidth for providing all sorts of services are just much weaker to begin with, and that makes them more reliant on federal monies.’” (Anguiano)`}
          </Blockquote>
          <Text>
            {`I quite liked the writing style here. It’s certainly argumentative, but I’vealways been partial to arguments based in calm logic, which I’d say this seems to be. Anguiano pulls in some expert opinions here, which is quite beneficial to her argument. She does still write well, referring to their unease despite support of the president. It could be written to sway people there, and I believe it would do it relatively effectively.`}
          </Text>
        </>
      )
    },
    {
      title: "Guardian on US Military Policy for Trans Troops",
      content: (
        <>
          <Blockquote>
            {`“The latest order to commanders relies on routine annual health checks that service members are required to undergo. Another defense official said the Pentagon has scrapped – for now – plans to go through troops’ health records to identify those with gender dysphoria.\n\nInstead, transgender troops who do not voluntarily come forward could be outed by commanders or others aware of their medical status. Gender dysphoria occurs when a person’s biological sex does not match up with their gender identity.” (Guardian)`}
          </Blockquote>
          <Text>
            {`This article has a much more passive writing style as well, mostly detailing reports from AP. Surely the military has better things to do than snitch on its own members, and I’m not quite sure why they’re so concerned about transgender members. I’m not so sure that this task qualifies for the budget increases while the rest of the government is getting stripped bare. They do use the word “outed” which perhaps has vaguely negative connotations.`}
          </Text>
        </>
      )
    },
    {
      title: "Guardian on Compliance and Statistics for Trans Troops Policy",
      content: (
        <>
          <Blockquote>
            {`“The defense official said it is the duty of the service member and the commander to comply with the new process.\n\nOfficials have said that as of 9 December 2024, there were 4,240 troops diagnosed with gender dysphoria in the active duty, national guard and reserve. But they acknowledge the actual number may be higher.\nTrump tried to ban transgender troops during his first term, while allowing those currently serving to stay on. Joe Biden overturned the ban after he became president.” (Guardian)`}
          </Blockquote>
          <Text>
            {`“Diagnosed with gender dysphoria” inherently denies transsexuality, disregarding the shift in gender as a matter of dysphoria, or “not real.” Trump clearly has little to do in his days apart from playing golf and eating Cheetos, so spends his time denying the existence of those he finds odd, unusual. It’s a bit silly that they’re keeping statistics on this, as if it’s a genuine effort and improvement that they’re making.`}
          </Text>
        </>
      )
    },
    {
      title: "Namkung on School Greening in Pasadena",
      content: (
        <>
          <Blockquote>
            {`“In a recent Saturday morning at Washington Elementary Stem magnet school in Pasadena, California, a group of volunteers and staffers from Amigos de los Rios hauled soil for a new pollinator garden of native plants that support local habitats such as those for butterflies, hummingbirds and bees. They also filled up 37 planter beds that will grow fresh veggies such as carrots and sweet potatoes for students to eat.\n\nBefore the local non-profit began this work, the Title I school – which is primarily attended by Latino and Black students from low-income households – had been largely paved, lacked trees and had one wooden playhouse that kids would patiently wait their turn to play inside to take refuge from the sun.” (Namkung)`}
          </Blockquote>
          <Text>
            {`I do so love heartwarming stories, and this one seems that it won’t disappoint. It’s a satisfying activity to complete, and does make a big difference. Namkung also uses “veggies” to further convince that this is beneficial to the children. It’s also quite nice that they’d do this in a low-income neighborhood, instead of making the rich ones even nicer.`}
          </Text>
        </>
      )
    },
    {
      title: "Namkung on the Benefits of Trees and Green Spaces",
      content: (
        <>
          <Blockquote>
            {`“Research predicts that two-thirds of the US will experience double the number of 100-degree days by mid-century. But trees offer a simple solution. In addition to cooling our cities by up to 10 degrees, trees reduce particulate pollution, which is a major contributor to asthma, cool play equipment, help protect kids from UV rays, absorb stormwater and lower air conditioning costs for schools. Other studies have shown that green schools and access to nature reduce stress, encourage physical activity and alleviate mental fatigue.\n\nThey are also a key part of young people’s futures: a recent USC study showed that LA’s urban trees are absorbing more carbon than expected.\n“Green space doesn’t just support childhood development – it supercharges it,” said Dan Lambe, CEO of the Arbor Day Foundation, a non-profit organization dedicated to planting trees.” (Namkung)`}
          </Blockquote>
          <Text>
            {`She uses logos relatively effectively here, and made a connection that I hadn’t thought of. The trees are shown to have pretty powerful benefits, and she backs it even further with a study from USC, which is known to be a relatively prestigious school. Further, she uses quotes from somebody, providing ethos, pathos, and logos all in one.`}
          </Text>
        </>
      )
    },
    {
      title: "Namkung on 'Nature Deficit Disorder' and Urban Greening",
      content: (
        <>
          <Blockquote>
            {`“Today’s children spend less time outdoors than any other generation – less than 10 minutes a day. Journalist and author Richard Louv calls this modern phenomenon “nature deficit disorder”. Urban greening and environmental education can help kids reconnect with nature and reduce the heat island effect that’s commonplace in LA neighborhoods that have lots of paved, heat-absorbing surface (and where Asian, Black and Latino people are more likely to live).\n\nAmigos de los Rios’ Robinson says there isn’t a minute to waste since “we are in this heat issue for good”.” (Namkung)`}
          </Blockquote>
          <Text>
            {`Pathos is used pretty effectively here, especially referring to the lack of nature as a deficit, a disorder. The provide what they’ve been doing as a possible solution to this deficit. Further, the quote here is used pretty well. Besides more ethos, the quote does quite well and adds a sense of urgency to the situation (“there isn’t a minute to waste”).`}
          </Text>
        </>
      )
    },
    {
      title: "Preparation",
      paragraphs: [
        `I find traditional test preparation to be exceedingly boring, and have long abstained from it. That being said, I did do some, most unfortunately. I would put myself under time when writing the Spartan reviewed essays, and I believe for the most part I pushed each of them out in one sitting. To practice analysis, I began both Kazuo Ishiguro’s The Remains of the Day, after enjoying (to a degree) Ishiguro’s Never Let Me Go. The actual vocabulary in these novels lacked the inevitable hell that I knew AP was sure to bring, and so I ran through ~50-100 pages worth of Greene’s The Elegant Universe. I also pushed my way through some articles before settling on the above. I found that perhaps some of the articles, despite the interest I took in them, would not be so suitable for this project. For instance, Scientific American has a trove of wonders, including this lovely read.`
      ]
    },
    {
      title: "Works Cited",
      paragraphs: [
        `Anguiano, Dani. “In California’s Deep-Red North, Voters Startled by Pace of Cuts – but They’re Still Backing Trump.” The Guardian, 16 May 2025. The Guardian, https://www.theguardian.com/us-news/2025/may/16/california-shasta-county-trump-cuts.`,
        `Bridle, James. “The Stupidity of AI.” The Guardian, 16 Mar. 2023. The Guardian, https://www.theguardian.com/technology/2023/mar/16/the-stupidity-of-ai-artificial-intelligence-dall-e-chatgpt.`,
        `Klein, Naomi, and Astra Taylor. “The Rise of End Times Fascism.” The Guardian, 13 Apr. 2025. The Guardian, https://www.theguardian.com/us-news/ng-interactive/2025/apr/13/end-times-fascism-far-right-trump-musk.`,
        `Namkung, Victoria. “Most of LA’s Trees Are in Wealthy, White Neighborhoods. This School Is Smashing Concrete to Plant Their Own.” The Guardian, 16 May 2025. The Guardian, https://www.theguardian.com/us-news/2025/may/16/la-schools-green-spaces.`,
        `“US Military Commanders to Be Told to Oust Trans Troops via Medical Checks.” The Guardian, 16 May 2025. The Guardian, https://www.theguardian.com/us-news/2025/may/16/military-trans-soldiers-medical-checks-trump.`
      ]
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