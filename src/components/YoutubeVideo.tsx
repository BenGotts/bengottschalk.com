interface YoutubeVideoProps {
    videoId: string;
}

export default function YoutubeVideo({ videoId }: YoutubeVideoProps) {
    return (
        // This wrapper ensures the iframe can shrink on smaller screens
        <div className="flex justify-center items-center max-w-full" style={{ maxWidth: "560px", maxHeight: "315px" }}>
            <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ maxWidth: "100%", maxHeight: "100%" }} // Ensures the video does not exceed the screen size
            ></iframe>
        </div>
    );
}


