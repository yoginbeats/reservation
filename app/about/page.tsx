import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, MapPin, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "About Us | SUPERLINES",
    description: "Learn about Superlines Transport history, fleet, and safety dedication.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden bg-zinc-900">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
                    style={{ backgroundImage: "url('/hero-bg.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center z-10">
                    <div className="flex h-20 w-20 items-center justify-center mb-6 rounded-3xl bg-white shadow-2xl">
                        <img src="/482809688_1079373070897719_6989867294877356725_n.jpg" alt="Logo" className="w-14 h-14 object-contain" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase max-w-4xl">
                        Journey With <span className="text-red-500">Excellence</span>
                    </h1>
                    <p className="mt-6 text-lg md:text-xl font-medium text-zinc-300 max-w-2xl">
                        Pioneering premium road transportation across the Philippines. Comfort, punctuality, and uncompromising safety since our inception.
                    </p>
                </div>
            </div>

            {/* Company Profile Section */}
            <div className="container mx-auto px-4 sm:px-6 py-16">
                <div className="mb-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-red-600 mb-2">Company Profile</h2>
                    <h3 className="text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">
                        The Story of Superlines Transportation Co., Inc.
                    </h3>
                </div>
                
                <div className="text-sm text-zinc-500 font-medium leading-relaxed space-y-4 text-justify">
                    <p>The Story of SUPERLINES TRANSPORTATION CO., INC. is a story of success. From its humble beginning, its one unit minibus rose to the present fleet of more than a hundred modern luxury buses.</p>
                    
                    <p>On January 11, 1975, young MANOLET ORTIZ LAVIDES founded Superlines Transportation Company, a single proprietorship whose main business address is his birthplace, Atimonan, Quezon. After acquiring a single unit of brand-new 35-seater Mazda minibus, the fledgling Manager had made it run in the Atimonan – Lucena route. Soon thereafter, he acquired another one (1) brand-new 35-seater mini bus and then followed by three (3) more 45-seater units to run Lucena – Calauag line.</p>

                    <div className="grid lg:grid-cols-2 gap-8 my-6">
                        <div className="space-y-4">
                            <p>In the middle of 1975, with the acquisition of ten (10) brand-new units and new lines, Manolet O. Lavides thought of shifting from sole proprietorship to a corporation. Upon consultation with his family and some close relatives, he finally decided to form a family corporation with him as the President and General Manager. He was also the Chief Operations Officer, the purchaser, OIC of the Drivers and Conductors rolled into one. From 1975 to 1989 these were the positions he held until the last national elections. At present, he is the Consultant and Chairman of the Board of STCI.</p>
                            
                            <p>In February 1977, with the granting of a new franchise, Superlines Transportation Company Incorporated (STCI) ran the Cubao – Sta. Elena, Camarines Norte line with a brand new fleet of ten (10) units of mini buses. With this line, Bicol Region ultimately opened its door wide to Superlines Transportation Company Incorporated for more fleet and opportunities.</p>
                            
                            <p>The following year, 1978, STCI was granted the franchise of Cubao – Daet (Cam. Norte) line. The company fielded fifteen (15) brand new units of ISUZU buses with longer and spacious bodies. Since then, newer and luxurious aircon units have plied this route to the satisfaction and comfort for the riding public.</p>
                            
                            <p>To pursue his career of public service, President and General Manager Manolet O. Lavides ran for the congressional seat in the Fourth District of Quezon which he won handily. Upon assumption of office, the neophyte Congressman relinquished his position to his brother Lawrence lest he be doubted for having a conflict of interest.</p>
                            
                            <p>From March 1987 up to July 1989 he purchased thirty (30) brand new Nissan units from Columbia Motors in staggered delivery and cash basis from Don Pepito Alvarez. From August 1989 to August 1991 he opened a Letter of Credit and bought twenty-six (26) units of Leyland Tiger from India. In 1992, he went to Tokyo and directly ordered fifty (50) CQR ISUZU 6RB1 units.</p>
                            
                            <p>From December 1993 to September 1994, twenty (20) brand new units imported for less than a year.</p>
                            <p>Then on December 15, 1995, five (5) brand new air conditioned units were acquired from Diamond Motors, and from January 1998 to April 1998, another batch of ten (10) FUSO 6D22 units were added and substituted to the old units.</p>
                            <p>Since then, at least twenty (20) units have been regularly added to the entire fleet every year which is the practice of big transportation companies.</p>
                        </div>
                        <div className="relative h-full min-h-[350px]">
                            <img 
                                src="/superlines-bus.jpg" 
                                alt="Superlines Bus" 
                                className="w-full h-full object-cover object-center shadow-md"
                            />
                        </div>
                    </div>

                    <p>At present, a total of one hundred fifty-five (155) units have been operating from Cubao, Quezon City to all municipalities in the 4th district Quezon including Bondoc Peninsula. All municipalities in Camarines Norte such as Daet, Labo, Talisay, Vinzons, Paracale/ Panganiban going to Naga and several towns in Camarines Sur and Albay including Legazpi City and vice versa with an average of eighty-five (85) to one hundred twenty (120) units in actual daily operation. Main terminal and garage in Bicol region is located at Daet, Camarines Norte with a total area of 28,000 square meters.</p>
                    <p>With the pending applications for new franchise with the LTFRB STCI aims to penetrate the Visayas region and hopefully up to the Mindanao area where people clamor for adequate means of transportation in which Superlines whose readiness to bring its services with warmth, sincerity, and hospitality to the people is the approximate solution.</p>
                </div>
            </div>

            {/* Stats / Numbers */}
            <div className="bg-zinc-950 py-20 text-white">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><MapPin className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">20+</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Routes Nationwide</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><Bus className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">150</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Modern Buses</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><ShieldCheck className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">500k</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Safe Journeys</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><Clock className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">98%</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">On-time Record</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="container mx-auto px-4 sm:px-6 py-24 text-center">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 mb-6">
                    Ready to Start Your Journey?
                </h2>
                <p className="text-lg text-zinc-500 font-medium max-w-xl mx-auto mb-10">
                    Join thousands of satisfied passengers who trust Superlines for their inter-provincial travel needs. Book your seat online today.
                </p>
                <div className="flex justify-center gap-4">
                    <Button asChild className="h-14 rounded-full px-8 text-sm font-bold bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-none transition-all hover:scale-105 active:scale-95">
                        <Link href="/schedule">View Schedule</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 rounded-full px-8 text-sm font-bold border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105 active:scale-95">
                        <Link href="/dashboard">Book Now <ArrowRight className="h-4 w-4 ml-2" /></Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
