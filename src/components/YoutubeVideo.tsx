interface YoutubeVideoProps {
    videoId?: string;
}

export default function YoutubeVideo({ videoId }: YoutubeVideoProps) {
    if (!videoId) return null;
    
    return (
        <div className="w-full flex justify-center items-center">
            <div className="relative w-full max-w-3xl aspect-video">
                <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}


