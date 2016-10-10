<?php
namespace commands;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class PullCommand extends Command
{
    protected $pages;

    protected $commandName = 'pull';
    protected $commandDescription = "builds from an existing repo";

    protected $commandArgumentName = "name";
    protected $commandArgumentDescription = "Location to pull from";

    protected $commandOptionName = ""; // should be specified like "app:greet John --cap"
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
    private function resetConfig (){
        $defaultConfigContent = <<<EOD
        {"dependencies":{"js":[],"css":[]},"providers":[],"app":{"name":"","Description":"","Author":""},"pages":[],"root":""}
EOD;
        Globals::saveJSON(json_decode($defaultConfigContent));
    }
    private function setAsRoot ($name){
        //$pages = Globals::getJSON();
        $this->pages->root = $name;
        //Globals::saveJSON($pages);
    }
    private function createPage(array $contents)
    {
        //$pages = Globals::getJSON();
        foreach ($contents as $key => $value){
            mkdir("app/pages/$key");
            $js = fopen("app/pages/$key/$key.js", "w");
            $css = fopen("app/pages/$key/$key.css", "w");
            $html = fopen("app/pages/$key/$key.html", "w");
            fwrite($html, $value->layout);
            fwrite($css, $value->css);
            fwrite($js, $value->events->ready);
            if($this->pages !== null){
                array_push($this->pages->pages, $key);
            }
        }
        // Globals::saveJSON($pages);
    }
    private function createProviders(array $contents)
    {
        //$pages = Globals::getJSON();
        foreach ($contents as $content){
            $key = Globals::generateRandomString();
            $js = fopen("app/providers/$key.js", "w");
            fwrite($js, $content);
            if($this->pages !== null){
                array_push($this->pages->providers, $key);
            }
        }
        //Globals::saveJSON($pages);
    }
    private function createDependencies(array $contents)
    {
        //$pages = Globals::getJSON();
        // Build JS
        foreach ($contents['js'] as $value){
            $key = Globals::generateRandomString();
            $js = fopen("app/dependencies/js/$key.js", "w");
            fwrite($js, $value);
            array_push($this->pages->dependencies->js, $key);
        }
        // Build CSS
        foreach ($contents['css'] as $value){
            $key = Globals::generateRandomString();
            $js = fopen("app/dependencies/css/$key.css", "w");
            fwrite($js, $value);
            array_push($this->pages->dependencies->css, $key);
        }
        //Globals::saveJSON($pages);
    }
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        /**
         * Get sample JSON
         * Parse, Create Pages.json, folders and
         */
        $testConf = $this->getFileContents("build/formelo.manifest");
        $testArray = json_decode($testConf);
        $this->pages = Globals::getJSON();
        $name = 'myname';
        $this->resetConfig();
        $applet =  (array) $testArray->applets;
        $selectApplet = (array) $applet[$name];
        //$this->setAsRoot((array) $selectApplet['root']);
        $this->createPage((array) $selectApplet['pages']);
        $this->createProviders( (array) $selectApplet['providers']);
        $this->createDependencies( (array) $selectApplet['dependencies']);
        Globals::saveJSON($this->pages);
        $output->writeln("$name page has been created.");
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
    private function getFileContents($filename){
        $handle = fopen($filename, "r") or die('Error opening '.$filename);
        $contents = fread($handle, filesize($filename)+1);
        fclose($handle);
        return $contents;
    }
}