<?php

namespace Database\Seeders;

use App\Models\LearningResource;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * The Learning Hub's demo library, published by the schools partner.
 *
 * Deliberately deterministic like the other demo seeders — no Faker, so a
 * screenshot is reproducible and two runs are comparable.
 *
 * Four of these are modules of the Coaches Education Programme, attached
 * via `listing_id`; the rest stand alone. That split is the whole reason
 * resources are not `Listing` rows: a module has no capacity, no price and
 * no sell-through bar, and giving it one would mean nothing.
 */
class DemoLearningResourcesSeeder extends Seeder
{
    public function run(): void
    {
        $partner = User::where('email', 'schools@tfe.com')->first();

        if (! $partner) {
            $this->command?->warn('No schools partner — skipping learning resources.');

            return;
        }

        // The programme these modules belong to, if it has been seeded.
        $course = Listing::where('publisher_id', $partner->id)
            ->where('name', 'Coaches Education Programme')
            ->first();

        foreach ($this->resources($course?->id) as $i => $r) {
            LearningResource::updateOrCreate(
                ['slug' => $r['slug']],
                $r + [
                    'publisher_type' => User::class,
                    'publisher_id' => $partner->id,
                    'is_published' => true,
                    'display_order' => $i,
                    'hero_image' => '/assets/img/backdrops/field-night.jpg',
                ],
            );
        }

        $this->command?->info('Learning Hub seeded: '.count($this->resources($course?->id)).' resources.');
    }

    private function resources(?int $courseId): array
    {
        return [
            [
                'slug' => 'planning-your-first-session',
                'title' => 'Planning your first session',
                'summary' => 'A four-part structure that works with forty children, one ball each or one ball between ten, and no pitch markings.',
                'body' => "Most first sessions fail for the same reason: too much talking and not enough ball. The structure below front-loads activity and saves the explanation for when players are already moving.\n\nArrive early and set the area before anyone turns up. A session that starts with twenty minutes of cone-laying has lost the group before it begins.\n\nSplit the hour into four: fifteen minutes of arrival activity that works however many turn up, fifteen of a skill in isolation, twenty of that skill under pressure in a small game, and ten of a game with no coaching at all. The last ten minutes are not a reward — they are where you see whether any of it stuck.",
                'category' => 'coaching',
                'audience' => 'coach',
                'level' => 'intro',
                'read_minutes' => 6,
                'listing_id' => $courseId,
            ],
            [
                'slug' => 'age-appropriate-training-loads',
                'title' => 'Age-appropriate training loads',
                'summary' => 'How much is too much for an U13 squad, and the signs of overtraining that show up in behaviour before they show up in performance.',
                'body' => "A growing player is not a small adult. Bone growth plates stay open into the late teens, and load that an adult absorbs without noticing accumulates differently in a fourteen-year-old.\n\nThe practical rule most federations converge on: total organised activity in hours per week should not exceed the player's age in years. A twelve-year-old playing twelve hours across school, club and academy is already at the ceiling before anyone adds a tournament.\n\nOvertraining shows up in behaviour first — reluctance to attend, irritability, a drop in schoolwork — and in performance second. By the time the performance dips, the player has usually been struggling for weeks.",
                'category' => 'wellbeing',
                'audience' => 'coach',
                'level' => 'intermediate',
                'read_minutes' => 8,
                'listing_id' => $courseId,
            ],
            [
                'slug' => 'safeguarding-essentials-for-schools',
                'title' => 'Safeguarding essentials for schools',
                'summary' => 'The minimum every club and school running sessions should have in place: recruitment checks, supervision ratios, and who a child tells.',
                'body' => "Safeguarding is not a document. It is whether a child who is worried knows exactly who to tell, and whether that person knows exactly what to do next.\n\nStart with three things. Name a designated safeguarding lead and put their name and number where players and parents can see it, not in a folder. Never let an adult be alone and unobserved with a child — two-deep supervision is the standard, and it protects the adult as much as the child. Check the people you recruit, including volunteers, and record that you did.\n\nWrite down what you would do if a disclosure happened tomorrow. If the answer takes more than a minute to find, the process is not ready.",
                'category' => 'safeguarding',
                'audience' => 'administrator',
                'level' => 'intro',
                'read_minutes' => 7,
                'listing_id' => $courseId,
            ],
            [
                'slug' => 'talking-to-parents-about-pathways',
                'title' => 'Talking to parents about pathways',
                'summary' => 'How to have an honest conversation about a young player\'s prospects without either crushing them or overselling a trial.',
                'body' => "The hardest conversation in youth football is the honest one about how few players make it, held with a parent who has rearranged their life around the possibility.\n\nBe specific rather than encouraging. \"He is one of the better players in this age group in this county\" is useful; \"he has a real chance\" is not, because the parent and the coach are picturing different chances.\n\nAlways describe the alternative pathways in the same conversation, not as a consolation afterwards: coaching, officiating, sports science, administration. A player who leaves the game at seventeen believing there was nothing else for them is a loss the sport did not need to take.",
                'category' => 'coaching',
                'audience' => 'parent',
                'level' => 'intermediate',
                'read_minutes' => 5,
                'listing_id' => null,
            ],
            [
                'slug' => 'running-a-school-league',
                'title' => 'Running a school league on no budget',
                'summary' => 'Fixtures, referees, kit and transport for a twelve-school league, and the order to solve them in.',
                'body' => "A league collapses in its third week, not its first. The first week runs on enthusiasm; the third runs on whether the fixture list, the referees and the transport actually hold.\n\nSolve transport first, because it is the constraint everything else bends around. Schools within walking distance of each other should play each other most often, whatever the draw says.\n\nRecruit referees from the sixth form and train them — an officiating pathway costs nothing and solves the problem permanently. Publish the fixture list for the whole season before week one, and do not move a game unless a pitch is unplayable.",
                'category' => 'administration',
                'audience' => 'teacher',
                'level' => 'intro',
                'read_minutes' => 9,
                'listing_id' => null,
            ],
            [
                'slug' => 'the-laws-every-teacher-should-know',
                'title' => 'The laws every teacher should know',
                'summary' => 'Ten decisions that account for most disputes in school football, explained without the rulebook language.',
                'body' => "Most arguments in school football come from about ten situations, and almost none of them are offside.\n\nAdvantage is the one teachers most often miss: if the team that was fouled still has the ball and is going forward, let it run. Blowing the whistle rewards the foul.\n\nHandball is not \"any contact with the arm\" — it is whether the arm made the body unnaturally bigger, or whether the player deliberately played it. A ball struck onto an arm from close range by an opponent is almost never an offence.",
                'category' => 'officiating',
                'audience' => 'teacher',
                'level' => 'intro',
                'read_minutes' => 6,
                'listing_id' => $courseId,
            ],
        ];
    }
}
