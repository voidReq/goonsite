import '@mantine/core/styles.css';
import LandingPageComponent from "../components/landingPageComponent";

export default function ShortNonFiction() {
    return (
        <LandingPageComponent
            imgSrc='https://m.media-amazon.com/images/I/61zwec5kIIL.jpg'
            folder="non-fiction"
            title="The Cheating Culture"
            desc={`
                Where did America's morales go? In the Cheating Culture, David Callahan details the many ways ordinary Americans cheat.
                Even as conventional street crime go down, the rate of fraud has been higher than ever before. Ordinary people are becoming more and more cynical, as they are being left behind in society by the "Winning Class".
                Callahan takes us on a tour of cheating in America, and makes us reconsider the ideals that American society is built upon. 
                `}
        />

    );
}