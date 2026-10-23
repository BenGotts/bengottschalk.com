interface YoutubeVideoProps {
    videoId: string;
    title: string;
}

export default function YoutubeVideo({ videoId, title }: YoutubeVideoProps) {
    return (
        <div className="aspect-video w-full overflow-hidden rounded-box border border-base-300 bg-base-200">
            <iframe
                className="size-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                title={title}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
    );
};
