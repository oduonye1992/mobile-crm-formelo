<?php
namespace commands;
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
    protected $commandOptionDescription = 'If set, it will make tis page the root page';

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
        $name = $input->getArgument($this->commandArgumentName);
        $setAsMain = false;
        if ($input->getOption($this->commandOptionName)) {
            $setAsMain = true;
        }
        $io = new SymfonyStyle($input, $output);
        $appname = $io->ask("Enter a username");
        $appPassword = $io->askHidden('What is your password?', function ($password) {
            if (empty($password)) {
                throw new \RuntimeException('Password cannot be empty.');
            }
            return $password;
        });
        $io->success("Deployed.");
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