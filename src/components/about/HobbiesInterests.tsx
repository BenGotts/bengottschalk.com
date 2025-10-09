export default function HobbiesInterests() {
    return (
        <section className="max-w-4xl mx-auto px-4 py-8" id="HobbiesInterests">
          <h2 className="text-3xl font-bold text-center md:text-left mb-6">Hobbies & Interests</h2>
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              My curiosity and drive extend beyond the realms of software development. Here are some activities that fuel my creativity and passion for learning:
            </p>
            <ul className="list-disc list-inside text-lg text-gray-700">
              <li><strong>Rubik's Cubes:</strong> I enjoy solving Rubik's Cubes and regularly help organize and run as well as participate in <a className="hover:text-blue-500" href="https://www.worldcubeassociation.org/" target="_blank">WCA competitions</a>.</li>
              <li><strong>Music:</strong> Playing the trumpet has been a significant part of my life. Such as performing with the Oregon State University Marching Band (OSUMB) throughout my college years and currently performing with the Hillsboro Symphony Orchestra (HSO).</li>
              <li><strong>Coding Projects:</strong> I like to code up random projects, exploring new technologies (such as this website with Next.JS) and pushing the boundaries of what I can create with code.</li>
            </ul>
          </div>
        </section>
      );
}


