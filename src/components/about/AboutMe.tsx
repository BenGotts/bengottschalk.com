import Link from "next/link";

export default function AboutMe() {
    return (
        <section id="AboutMe" className="space-y-4">
            <h1 className="text-4xl font-bold">About Me</h1>
            <p className="text-lg leading-relaxed">
                Hi there! My name is Benjamin Gottschalk and I am a motivated Software Engineer with a Bachelor of Science in Computer Science and a minor in Mathematics from Oregon State University. My time at OSU has equipped me with a solid foundation in computer science principles and mathematics, allowing me to solve complex problems and engineer innovative solutions.
            </p>
            <p className="text-lg leading-relaxed">
                Beyond my academics, I am a competitive Rubik's Cube solver, regularly participating in competitions all over the world! You can take a look at my upcoming competitions <Link className="link link-primary" href="/competitions">here</Link>. I also play the trumpet, and had the privilege of performing with the Oregon State University Marching Band (OSUMB) throughout my college years.
            </p>
        </section>
    );
}
