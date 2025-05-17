import '@mantine/core/styles.css';
import { getPosts } from "../util/load-posts";
import LandingPageComponent from "../components/landingPageComponent";

const posts = getPosts("east-of-eden");

export default function EastOfEdenPage() {
    return (
        <LandingPageComponent
            imgSrc="https://cdn.clearcreekresources.org/wp-content/uploads/2022/02/MicrosoftTeams-image-26-scaled.jpg"
            folder="east-of-eden"
            title="East of Eden"
            desc={`East of Eden is a book written by John Steinbeck. The book explores the intertwining history of two families, the Trasks and the Hamiltons, in California's Salinas Valley.
                        The book explores themes such as free will, the battle between good and evil, and the mysterious nature of love.`}
        />

    );
}