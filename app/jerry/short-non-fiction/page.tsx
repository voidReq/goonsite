import '@mantine/core/styles.css';
import LandingPageComponent from "../components/landingPageComponent";

export default function ShortNonFiction() {
    return (
        <LandingPageComponent
            folder="short-non-fiction"
            title="Short Non-Fiction"
            desc={`
                BBC articles and National Geographic. Oh, and did I mention studying for AP Lang?
                That's right. The heart of AP Lang lies in short non fiction articles.
                `}
        />
    );
}