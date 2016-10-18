<?php
namespace commands;
use GuzzleHttp\Client;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class DeployCommand extends Command
{
    protected $commandName = 'deploy';
    protected $commandDescription = "Initializes the Application";

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

        // G E T   V A L U E S
        $buildConfig = Globals::getFileContents('build/formelo.manifest');
        $conf = Globals::getJSON();
        $username = $conf->cred->username;
        $apikey = $conf->cred->api_key;
        $realm = $conf->code;
        $id = $conf->id;
        if ($username == "" || $apikey == ""){
            return $io->error("Kindly initialize your app by running 'php formelo init'");
        }

        // P U S H   T O   A P P  S T O R E
        $io->text('Deploying...');
        try {
            $client = new Client();
            $res = $client->request("PUT", "https://$realm.formelo.com/api/v1/applets/$id.json", [
                'auth' => [$username, $apikey],
                'headers'  => ['content-type' => 'application/json; charset=UTF-8', 'Accept' => 'application/json'],
                'json' => json_decode($buildConfig)
            ]);
            $io->success("Deployed.");
        } catch (\Exception $e) {
            $io->error("Unable to deploy." . $e->getMessage());
        }
    }
    private function getJSON(){
        $filename = "app/pages/pages.json";
        $handle = fopen($filename, "r");
        $contents = fread($handle, filesize($filename));
        fclose($handle);
        return json_decode($contents);
    }
    private function saveJSON($json){
        $filename = "app/pages/pages.json";
        $handle = fopen($filename, "w");
        fwrite($handle, json_encode($json));
        fclose($handle);
    }
}