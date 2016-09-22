<?php
namespace commands;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class ImportCSSCommand extends Command
{
    protected $commandName = 'import:css';
    protected $commandDescription = "Imports an external CSS file";

    protected $commandArgumentName = "name";
    protected $commandArgumentDescription = "Who do you want to greet?";

    protected $commandOptionName = "root"; // should be specified like "app:greet John --cap"
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
        $io = new SymfonyStyle($input, $output);
        $name = $input->getArgument($this->commandArgumentName);
        $setAsMain = false;
        if ($input->getOption($this->commandOptionName)) {
            $setAsMain = true;
        }
        $filename = $name;
        // TODO validate link
        $io->text("Fetching $filename");
        $homepage = file_get_contents($filename);
        $depName = $io->ask("Choose a name for this dependency");
        if (file_exists("app/dependencies/$depName.css")){
            throw new \RuntimeException("$depName already exists.");
        }
        $fileContents = <<<EOD
$homepage
EOD;
        $js = fopen("app/dependencies/css/$depName.css", "w");
        fwrite($js, $fileContents);
        $pages = $this->getJSON();
        array_push($pages->dependencies->css, $depName);
        $this->saveJSON($pages);
        $io->success("$depName has been imported.");
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