import '@mantine/core/styles.css';
import { Image } from '@mantine/core';
import slugPageBuilder from "../components/slugPageBuilder";


export default slugPageBuilder("painter-thief", "blog.md",
    <Image
        src="https://platform.vox.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/19992699/painter1.jpg?quality=90&strip=all&crop=7.8125,0,84.375,100"
        alt="Painter Thief"
        radius="md"
    />);
