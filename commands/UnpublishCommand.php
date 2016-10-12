<?php
namespace commands;
use GuzzleHttp\Client;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class UnpublishCommand extends Command
{
    protected $commandName = 'unpublish';
    protected $commandDescription = "Unpublishes your applet from the app store.";

    protected $commandArgumentName = "name";
    protected $commandArgumentDescription = "";

    protected $commandOptionName = "name"; // should be specified like "app:greet John --cap"
    protected $commandOptionDescription = '';

    protected function configure(){
        $this
            ->setName($this->commandName)
            ->setDescription($this->commandDescription)
            ->addArgument(
                $this->commandArgumentName,
                InputArgument::OPTIONAL,
                $this->commandArgumentDescription
            )
            ->addOption(
                $this->commandOptionName,
                null,
                InputOption::VALUE_NONE,
                $this->commandOptionDescription
            );
    }
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $io = new SymfonyStyle($input, $output);
        $config = (array) Globals::getJSON();

        // G E T   A P P  S T O R E   P A R A M S
        $username = $config['cred']->username;
        $apikey = $config['cred']->api_key;
        $appTeam = $config['code'];
        $appID = $config['id'];
        $data = [
            'action' => 'unpublish',
            'id' => $appID
        ];

        $confirmation  = $io->choice("Do you want to continue", ['y', 'n'], 'y');
        if ($confirmation == "n"){
            return false;
        }
        // R E G I S T E R   T O   A P P  S T O R E
        $io->text('UnPublishing...');
        $client = new Client();
        try {
            $res = $client->request('POST', "$appTeam.formelo.com/api/applets/process", [
                'auth' => [$username, $apikey],
                'headers'  => [
                    'content-type' => 'application/json; charset=UTF-8',
                    'Accept' => 'application/json'
                ],
                'json' => $data
            ]);
            if ($res->getStatusCode() == 201 || $res->getStatusCode() == 200) {
                $responseHeader = $res->getHeaders();
                $io->success(array(
                    'Your app has been published successfully',
                ));
            }
        } catch (\Exception $e) {
            $io->error("Error connecting to server. ".$e->getMessage());
        }
    }
}